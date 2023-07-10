//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import {GelatoRelayContext} from '@gelatonetwork/relay-context/contracts/GelatoRelayContext.sol';
import {Address} from '@openzeppelin/contracts/utils/Address.sol';
import '@gnosis.pm/safe-contracts/contracts/common/Enum.sol';

interface GnosisSafe {
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) external returns (bool success);

    function isModuleEnabled(address module) external view returns (bool);
}

struct Transaction {
    address to;
    uint256 value;
    bytes data;
    Enum.Operation operation;
    uint256 safeTxGas;
    uint256 baseGas;
    uint256 gasPrice;
    address gasToken;
    address payable refundReceiver;
    bytes signatures;
}

contract SponsorGasModule is GelatoRelayContext {
    using Address for address payable;

    event GasTransferred(
        address indexed _feeCollector,
        uint256 _fee,
        address indexed _token
    );
    event GasLimitApproved(
        address indexed _safe,
        address indexed _token,
        uint256 _gasLimit
    );

    bytes4 public constant ERC20_TRANSFER_SIG = 0xa9059cbb;
    bytes4 public constant EXEC_TRANSACTION_SIG = 0x6a761202;
    address public constant NATIVE_TOKEN =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    error NonZeroRefundReceiver(address refundReceiver);
    error NativeTokenTransferFailed(address feeCollector, uint256 fee);
    error ERC20TransferFailed(address token, address feeCollector, uint256 fee);
    error ExecutionFailed(address safe);
    error ModuleNotEnabled(address safe);
    error NoGasLimitSet(address safe, address token);
    error NotEnoughGasApproved(
        address safe,
        address token,
        uint256 gasLimit,
        uint256 gasRequired
    );

    mapping(address => mapping(address => uint256)) public approvedGasLimit;

    function setApprovedGasLimit(address token, uint256 gasLimit) external {
        if (!GnosisSafe(msg.sender).isModuleEnabled(address(this)))
            revert ModuleNotEnabled(msg.sender);
        approvedGasLimit[msg.sender][token] = gasLimit;
        emit GasLimitApproved(msg.sender, token, gasLimit);
    }

    function payRelayerFee(GnosisSafe safe) internal {
        uint256 gasLimit = approvedGasLimit[address(safe)][_getFeeToken()];
        if (gasLimit == 0) revert NoGasLimitSet(address(safe), _getFeeToken());
        if (gasLimit < _getFee())
            revert NotEnoughGasApproved(
                address(safe),
                _getFeeToken(),
                gasLimit,
                _getFee()
            );

        if (_getFeeToken() == NATIVE_TOKEN) {
            if (
                !safe.execTransactionFromModule(
                    _getFeeCollector(),
                    _getFee(),
                    '',
                    Enum.Operation.Call
                )
            ) {
                revert NativeTokenTransferFailed(_getFeeCollector(), _getFee());
            }
        } else {
            // FUTURE for ERC20 fees
            if (
                !safe.execTransactionFromModule(
                    _getFeeToken(),
                    0,
                    abi.encodeWithSelector(
                        ERC20_TRANSFER_SIG,
                        _getFeeCollector(),
                        _getFee()
                    ),
                    Enum.Operation.Call
                )
            ) {
                revert ERC20TransferFailed(
                    _getFeeToken(),
                    _getFeeCollector(),
                    _getFee()
                );
            }
        }

        emit GasTransferred(_getFeeCollector(), _getFee(), _getFeeToken());
    }

    function execTransaction(
        GnosisSafe safe,
        Transaction memory trxn
    ) public payable virtual onlyGelatoRelay returns (bool success) {
        if (trxn.refundReceiver != address(0)) {
            revert NonZeroRefundReceiver(trxn.refundReceiver);
        }

        payRelayerFee(safe);

        success = safe.execTransactionFromModule(
            address(safe),
            0,
            abi.encodeWithSelector(
                EXEC_TRANSACTION_SIG,
                trxn.to,
                trxn.value,
                trxn.data,
                trxn.operation,
                trxn.safeTxGas,
                trxn.baseGas,
                trxn.gasPrice,
                trxn.gasToken,
                trxn.refundReceiver,
                trxn.signatures
            ),
            Enum.Operation.Call
        );

        if (!success) {
            revert ExecutionFailed(address(safe));
        }
    }
}
