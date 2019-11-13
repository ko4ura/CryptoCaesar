pragma solidity >=0.5.8 <0.6.0;

import "./Territory.sol";
import "./Ownable.sol";


/**
 *  @title Games controller
 *  @notice Contract for controlling creating new territory for battle
 */
contract CryptoCaesarControl is Ownable{
    Territory[] public allGames;
    uint public periodRestarting;
    uint public maxLengthRound;
    constructor() public{
        periodRestarting = 108000 minutes;
        maxLengthRound = 10080 minutes;
    }

    event LogCreateGame(address creator, uint timestamp, Territory newGame);
    event LogExceededMaxLengthRound(address creator, uint256 amount, uint timestamp, uint lengthRound);

    function getAllGames() public view returns (Territory[] memory) {
        return allGames;
    }

    function changePeriodRestarting(uint _periodRestarting) public onlyOwner{
        periodRestarting = _periodRestarting * 1 minutes;
    }

    function changeMaxLengthRound(uint _maxLengthRound) public onlyOwner{
        maxLengthRound = _maxLengthRound * 1 minutes;
    }

    function getPeriodRestarting() public view returns(uint){
        return periodRestarting;
    }

    function getMaxLengthRound() public view returns(uint){
        return maxLengthRound;
    }

    function createGame(uint _lengthRound)public payable returns (Territory) {
        Territory newGame;
        uint lengthRound = _lengthRound * 1 minutes;
        if(lengthRound <= maxLengthRound){
            newGame = (new Territory).value(msg.value)(_lengthRound, msg.sender, periodRestarting);
            allGames.push(newGame);
            emit LogCreateGame(msg.sender, now, newGame);
        } else {
            address(uint160(msg.sender)).transfer(msg.value);
            emit LogExceededMaxLengthRound(msg.sender, msg.value, now, _lengthRound);
        }
        return newGame;
    }
}
