// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EnergyP2P {

    // ========== SELLER DATA ==========
    struct Seller {
        uint256 unitsAvailable;    // kWh
        uint256 pricePerUnit;      // price per unit
    }

    mapping(address => Seller) public sellers;

    // ========== TRADE DATA ==========
    struct Trade {
        address seller;
        address buyer;
        uint256 units;
        uint256 pricePerUnit;
        uint256 totalPrice;
        uint256 timestamp;
    }

    uint256 public tradeCount;
    mapping(uint256 => Trade) public trades;

    // ========== EVENTS ==========
    event SellerOfferCreated(
        address indexed seller,
        uint256 units,
        uint256 pricePerUnit
    );

    event TradeCompleted(
        uint256 indexed tradeId,
        address indexed seller,
        address indexed buyer,
        uint256 units,
        uint256 totalPrice
    );

    // ========== SELLER ACTION ==========
    // Seller creates or updates offer
    function createSellerOffer(
        uint256 _units,
        uint256 _pricePerUnit
    ) external {
        require(_units > 0, "Invalid units");
        require(_pricePerUnit > 0, "Invalid price");

        sellers[msg.sender].unitsAvailable = _units;
        sellers[msg.sender].pricePerUnit = _pricePerUnit;

        emit SellerOfferCreated(msg.sender, _units, _pricePerUnit);
    }

    // ========== BUYER ACTION ==========
    // Buyer confirms purchase
    function buyerConfirm(
        address _seller,
        uint256 _unitsToBuy
    ) external {
        require(_unitsToBuy > 0, "Invalid units");

        Seller storage s = sellers[_seller];
        require(s.unitsAvailable >= _unitsToBuy, "Not enough energy");

        uint256 totalPrice = _unitsToBuy * s.pricePerUnit;

        // Update seller energy
        s.unitsAvailable -= _unitsToBuy;

        // Record trade
        tradeCount++;
        trades[tradeCount] = Trade(
            _seller,
            msg.sender,
            _unitsToBuy,
            s.pricePerUnit,
            totalPrice,
            block.timestamp
        );

        emit TradeCompleted(
            tradeCount,
            _seller,
            msg.sender,
            _unitsToBuy,
            totalPrice
        );
    }

    // ========== VIEW FUNCTION ==========
    function getTrade(uint256 _id)
        external
        view
        returns (
            address seller,
            address buyer,
            uint256 units,
            uint256 pricePerUnit,
            uint256 totalPrice,
            uint256 timestamp
        )
    {
        Trade storage t = trades[_id];
        return (
            t.seller,
            t.buyer,
            t.units,
            t.pricePerUnit,
            t.totalPrice,
            t.timestamp
        );
    }
}
