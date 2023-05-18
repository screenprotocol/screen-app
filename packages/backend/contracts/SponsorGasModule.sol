//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.12;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {GelatoRelayContext} from '@gelatonetwork/relay-context/contracts/GelatoRelayContext.sol';
import {Address} from '@openzeppelin/contracts/utils/Address.sol';
import '@gnosis.pm/safe-contracts/contracts/common/Enum.sol';

interface GnosisSafe {
    function nonce() external view returns (uint256);

    /// @dev Allows a Module to execute a Safe transaction without any further confirmations.
    /// @param to Destination address of module transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction.
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) external returns (bool success);

    function checkSignatures(
        bytes32 dataHash,
        bytes memory data,
        bytes memory signatures
    ) external view;

    function encodeTransactionData(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address refundReceiver,
        uint256 _nonce
    ) external view returns (bytes memory);
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

    function execTransaction(
        GnosisSafe safe,
        Transaction memory trxn
    ) public payable virtual onlyGelatoRelay returns (bool success) {
        // FUTURE for ERC20 fees
        // bytes memory data = abi.encodeWithSelector(
        //     IERC20(_getFeeToken()).transfer.selector,
        //     _getFeeCollector(),
        //     _getFee()
        // );

        // safe.execTransactionFromModule(
        //     _getFeeToken(),
        //     0,
        //     data,
        //     Enum.Operation.Call
        // );

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

        require(
            safe.execTransactionFromModule(
                _getFeeCollector(),
                _getFee(),
                '',
                Enum.Operation.Call
            ),
            'Could not execute Ether transfer to gelato fee collector'
        );
    }
}
