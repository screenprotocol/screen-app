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

    address public constant NATIVE_TOKEN =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    function execTransaction(
        GnosisSafe safe,
        Transaction memory trxn
    ) public payable virtual onlyGelatoRelay returns (bool success) {
        if (_getFeeToken() == NATIVE_TOKEN) {
            require(
                safe.execTransactionFromModule(
                    _getFeeCollector(),
                    _getFee(),
                    '',
                    Enum.Operation.Call
                ),
                'Could not execute Ether transfer to gelato fee collector'
            );
        } else {
            // FUTURE for ERC20 fees
            bytes memory data = abi.encodeWithSelector(
                IERC20(_getFeeToken()).transfer.selector,
                _getFeeCollector(),
                _getFee()
            );

            require(
                safe.execTransactionFromModule(
                    _getFeeToken(),
                    0,
                    data,
                    Enum.Operation.Call
                ),
                'Could not execute ERC20 transfer to gelato fee collector'
            );
        }

        success = safe.execTransactionFromModule(
            address(safe),
            0,
            abi.encodeWithSignature(
                'execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)',
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

        require(success, 'Could not execute Safe transaction');
    }
}
