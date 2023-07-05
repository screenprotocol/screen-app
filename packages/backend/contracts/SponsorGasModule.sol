//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
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

    bytes4 public constant EXEC_TRANSACTION_SIG = 0x6a761202;
    address public constant NATIVE_TOKEN =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    error NonZeroRefundReceiver(address refundReceiver);
    error NativeTokenTransferFailed(address feeCollector, uint256 fee);
    error ERC20TransferFailed(address token, address feeCollector, uint256 fee);
    error ExecutionFailed(address safe);

    function execTransaction(
        GnosisSafe safe,
        Transaction memory trxn
    ) public payable virtual onlyGelatoRelay returns (bool success) {
        if (trxn.refundReceiver != address(0)) {
            revert NonZeroRefundReceiver(trxn.refundReceiver);
        }

        if (_getFeeToken() == NATIVE_TOKEN) {
            success = safe.execTransactionFromModule(
                _getFeeCollector(),
                _getFee(),
                '',
                Enum.Operation.Call
            );

            if (!success) {
                revert NativeTokenTransferFailed(_getFeeCollector(), _getFee());
            }
        } else {
            // FUTURE for ERC20 fees
            success = safe.execTransactionFromModule(
                _getFeeToken(),
                0,
                abi.encodeWithSelector(
                    IERC20(_getFeeToken()).transfer.selector,
                    _getFeeCollector(),
                    _getFee()
                ),
                Enum.Operation.Call
            );
            if (!success) {
                revert ERC20TransferFailed(
                    _getFeeToken(),
                    _getFeeCollector(),
                    _getFee()
                );
            }
        }

        emit GasTransferred(_getFeeCollector(), _getFee(), _getFeeToken());

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
