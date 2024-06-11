// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract HelloWorld {
    string public _value;

    constructor(string memory value) {
        _value = value;
    }

    function get() public view returns (string memory) {
        return _value;
    }
}
