pragma solidity >=0.5.8 <0.6.0;
pragma experimental ABIEncoderV2;

contract Territory {
    address owner;
    address richerUser;
    uint256 biggestContribution;
    uint timeEnd;
    uint timeStart;
    uint lengthRound;
    bool gameEnd = false;
    uint periodRestarting;

    struct Contribution {
        address user;
        uint timestamp;
        uint256 amount;
        bool becomeLeader;
    }

    Contribution[] Contributions;

    constructor(uint _lengthRound, address _owner, uint _periodRestarting) payable public{
        owner = _owner;
        richerUser = _owner;
        biggestContribution = msg.value;
        timeEnd = now + _lengthRound * 1 minutes;
        lengthRound = _lengthRound;
        timeStart = now;
        periodRestarting = _periodRestarting;
    }

    event LogReceived(address payer, uint timestamp,  uint256 amount, bool becomeLeader);
    event LogWithdrawal(address sender, address richerUser, uint timestamp, uint256 amount);
    event LogEndGame(address emitterEndGame, address richerUser, uint timestamp, uint256 amount);
    event LogRestartGame(address emitterRestartGame, uint timestamp, uint256 amount);

    function _newContribution(address _user, uint _timestamp, uint256 _amount, bool _becomeLeader) internal {
        emit LogReceived(_user, _timestamp, _amount, _becomeLeader);
        Contribution memory contribution = Contribution(_user, _timestamp, _amount, _becomeLeader);
        Contributions.push(contribution);
    }


    function() payable external {
        received(msg.sender, uint256(msg.value));
    }

    function received(address _payer, uint256 _amount) internal{
        if(timeEnd > now){
            if(_amount > biggestContribution){
                richerUser = _payer;
                biggestContribution = _amount;
                timeEnd = now + lengthRound * 1 minutes;
                _newContribution(_payer, now, _amount, true);
            } else {
                _newContribution(_payer, now, _amount, false);
            }
        } else {
            gameEnd = true;
            _newContribution(_payer, now, _amount, false);
            emit LogEndGame(_payer, richerUser, now, address(this).balance);
        }
    }

    function getWithdrawal() external{
        if(timeEnd <= now){
            gameEnd = true;
            emit LogEndGame(msg.sender, richerUser, now, address(this).balance);
        }
        if(gameEnd && (richerUser == msg.sender)){
            uint256 contractBalance = address(this).balance;
            address(uint160(richerUser)).transfer(contractBalance);
            emit LogWithdrawal(richerUser, richerUser, now, contractBalance);
        }
    }

    function getContributions() public view returns(Contribution[] memory){
        return Contributions;
    }

    function restartGame() public payable {
        if(gameEnd && ((timeEnd + periodRestarting) < now) ){
            if(biggestContribution < msg.value) {
                richerUser = msg.sender;
                biggestContribution = msg.value;
                gameEnd = false;
                timeEnd = (lengthRound * 1 minutes) + now;
                _newContribution(msg.sender, now, msg.value, true);
                emit LogRestartGame(msg.sender, now, msg.value);
            } else {
                _newContribution(msg.sender, now, msg.value, false);
            }
        } else if(msg.value > 0){
            _newContribution(msg.sender, now, msg.value, false);
        }
    }

    function getGameInfo()
    public view
    returns (
        address o_owner,
        address o_richerUser,
        uint256 o_biggestContribution,
        uint o_timeEnd,
        uint o_timeStart,
        uint256 o_gameBalance,
        bool o_gameEnd,
        uint o_lengthRound,
        uint o_periodRestarting
    ){
        o_owner = owner;
        o_richerUser = richerUser;
        o_biggestContribution = biggestContribution;
        o_timeEnd = timeEnd;
        o_timeStart = timeStart;
        o_gameBalance = address(this).balance;
        o_gameEnd = gameEnd;
        o_lengthRound = lengthRound;
        o_periodRestarting = periodRestarting;
    }

}
