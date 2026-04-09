// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StarRegistry {
    struct Star {
        string name;
        uint8 colorIndex;
        uint256 registeredAt;
        bool exists;
    }

    mapping(address => Star) public stars;
    address[] public registeredAddresses;

    event StarRegistered(
        address indexed wallet,
        string name,
        uint8 colorIndex,
        uint256 timestamp
    );

    event StarUpdated(
        address indexed wallet,
        string name,
        uint8 colorIndex
    );

    function registerStar(string calldata _name, uint8 _colorIndex) external {
        require(_colorIndex < 4, "Invalid color index");
        require(!stars[msg.sender].exists, "Star already registered");
        require(bytes(_name).length > 0 && bytes(_name).length <= 32, "Invalid name");

        stars[msg.sender] = Star({
            name: _name,
            colorIndex: _colorIndex,
            registeredAt: block.timestamp,
            exists: true
        });

        registeredAddresses.push(msg.sender);

        emit StarRegistered(msg.sender, _name, _colorIndex, block.timestamp);
    }

    function updateStar(string calldata _name, uint8 _colorIndex) external {
        require(stars[msg.sender].exists, "Star not registered");
        require(_colorIndex < 4, "Invalid color index");
        require(bytes(_name).length > 0 && bytes(_name).length <= 32, "Invalid name");

        stars[msg.sender].name = _name;
        stars[msg.sender].colorIndex = _colorIndex;

        emit StarUpdated(msg.sender, _name, _colorIndex);
    }

    function getStarInfo(address _wallet) external view returns (
        string memory name,
        uint8 colorIndex,
        uint256 registeredAt,
        bool exists
    ) {
        Star memory star = stars[_wallet];
        return (star.name, star.colorIndex, star.registeredAt, star.exists);
    }

    function getAllRegisteredAddresses() external view returns (address[] memory) {
        return registeredAddresses;
    }

    function getRegisteredCount() external view returns (uint256) {
        return registeredAddresses.length;
    }
}
