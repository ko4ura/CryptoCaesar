pragma solidity >=0.5.8 <0.6.0;

contract Ownable {
  address public owner;

  event LogTransferOwnership(
    address indexed previousOwner,
    address indexed newOwner
  );

  constructor() public {
    owner = msg.sender;
  }

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  function transferOwnership(address _newOwner) public onlyOwner {
    _transferOwnership(_newOwner);
  }

  function getTransferOwnership() public view returns(address){
    return owner;
  }

  function _transferOwnership(address _newOwner) internal {
    require(_newOwner != address(0));
    emit LogTransferOwnership(owner, _newOwner);
    owner = _newOwner;
  }
}
