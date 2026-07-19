// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract Provenn {
    struct Record { bytes32 hash; uint256 timestamp; address owner; }
    mapping(bytes32 => Record) private records;
    event HashStored(bytes32 indexed hash, address indexed owner, uint256 timestamp);
    function storeHash(bytes32 hash) external { require(records[hash].timestamp == 0, "Proof already exists"); records[hash] = Record(hash, block.timestamp, msg.sender); emit HashStored(hash, msg.sender, block.timestamp); }
    function verifyHash(bytes32 hash) external view returns (bool) { return records[hash].timestamp != 0; }
    function getRecord(bytes32 hash) external view returns (bytes32, uint256, address) { Record memory r = records[hash]; return (r.hash, r.timestamp, r.owner); }
}
