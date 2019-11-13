const GamesControl = artifacts.require("CryptoCaesarControl");

const getContractInstance = (contractName, owner, contrctAddress) => {
    const artifact = artifacts.require(contractName) // globally injected artifacts helper
    const deployedAddress = contrctAddress || artifact.networks[artifact.network_id].address;
    console.log('deployedAddress', deployedAddress);
    const instance = new web3.eth.Contract(artifact.abi, deployedAddress, {
        from: owner,
        gasPrice: '20000000000'
    })
    return instance
};

async function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

contract('CryptoCaesarControl', async (accounts
) => {
    let GC, WIRG;
    const gamesControlAddress = accounts[0];
    const gameCreatorAddress = accounts[1];
    const gameOpponentAddress = accounts[2];
    const gameOpponentAddress_2 = accounts[3];
    console.log('Accounts', accounts);

    it('Deploy Game Control', async () => {
        GC = await getContractInstance('CryptoCaesarControl', gamesControlAddress);
        const transferOwnership = await GC.methods.getTransferOwnership().call(
            { from: gamesControlAddress, gas: 4000000,gasPrice: 1 });
        assert.equal(transferOwnership, gamesControlAddress);
    });

    it('Check only owner change Period restarting', async () => {
        const periodRestarting = await GC.methods.getPeriodRestarting().call(
            { from: gamesControlAddress, gas: 4000000,gasPrice: 1 });
        try
        {
            await GC.methods.changePeriodRestarting(1000).send(
                {from: gameCreatorAddress, gas: 4000000,gasPrice: 1});
        } catch (ex) {
            //console.log('errorRevert', ex.toString())
        }
        const periodRestarting2 = await GC.methods.getPeriodRestarting().call(
            { from: gameCreatorAddress, gas: 4000000,gasPrice: 1 });

        assert.equal((parseInt(periodRestarting) / 60), 108000);
    });

    it('Check change Period restarting', async () => {
        const newPeriodRestarting = 1;
        await GC.methods.changePeriodRestarting(newPeriodRestarting).send(
            {from: gamesControlAddress, gas: 4000000,gasPrice: 1});
        const periodRestarting2 = await GC.methods.getPeriodRestarting().call(
            { from: gameCreatorAddress, gas: 4000000,gasPrice: 1 });

        assert.equal((parseInt(periodRestarting2) / 60), newPeriodRestarting);
    });

    it('Check change max length round', async () => {
        const newPeriodRestarting = 100;
        await GC.methods.changeMaxLengthRound(newPeriodRestarting).send(
            {from: gamesControlAddress, gas: 4000000,gasPrice: 1});
        const lengthRoundAfterChange = await GC.methods.getMaxLengthRound().call(
            { from: gameCreatorAddress, gas: 4000000, gasPrice: 1 });

        assert.equal((parseInt(lengthRoundAfterChange) / 60), newPeriodRestarting);
    });

    it('Create game with exceeding the maximum length of the round', async () => {
        const newLengthRound = 101;
        const gameCreatorBalance = await web3.eth.getBalance(gameCreatorAddress);
        const newGame = await GC.methods.createGame(
            newLengthRound
        ).send(
            { from: gameCreatorAddress, gas: 4000000,gasPrice: 1, value: '100000000000000000' });
        const eventLogExceededMaxLengthRound = newGame.events.LogExceededMaxLengthRound;
        const gameCreatorBalanceAfterCreate = await web3.eth.getBalance(gameCreatorAddress);
        assert.equal(eventLogExceededMaxLengthRound.returnValues.lengthRound, newLengthRound);
        assert.equal(web3.utils.toBN(gameCreatorBalance).toString(),
            web3.utils.toBN(gameCreatorBalanceAfterCreate).add(web3.utils.toBN(newGame.cumulativeGasUsed)).toString());
    });

    it('Greate new game', async () => {
        const newGame = await GC.methods.createGame(
            1
        ).send(
            { from: gameCreatorAddress, gas: 4000000,gasPrice: 1, value: '100000000000000000' });
        let eventLogCreateGame = newGame.events.LogCreateGame;
        WIRG = await getContractInstance('Territory', gameCreatorAddress, eventLogCreateGame.returnValues.newGame);
        assert.equal(eventLogCreateGame.returnValues.creator, gameCreatorAddress);
    });

    it('check get Game-Info Data', async () => {
        const gameInfo = await WIRG.methods.getGameInfo(
        ).call(
            { from: gameCreatorAddress, gas: 4000000,gasPrice: 1 });
        assert.equal(gameInfo.o_owner, gameCreatorAddress);
        assert.equal(gameInfo.o_richerUser, gameCreatorAddress);
        assert.equal(gameInfo.o_lengthRound, '1');
        assert.equal(gameInfo.o_gameBalance, '100000000000000000');
        assert.equal(gameInfo.o_biggestContribution, '100000000000000000');
    });

    it('change Richer', async () => {
        const gameInfo = await WIRG.methods.getGameInfo(
        ).call(
            {from: gameCreatorAddress, gas: 4000000,gasPrice: 1});
        assert.equal('100000000000000000', gameInfo.o_biggestContribution);
        assert.equal('100000000000000000', gameInfo.o_gameBalance);
        assert.equal(gameCreatorAddress, gameInfo.o_richerUser);

        await web3.eth.sendTransaction({
            from: gameOpponentAddress,
            to: WIRG.options.address,
            gas: 4000000,
           gasPrice: 1,
            value: '600000000000000000'
        });
        await wait(2000);
        const gameInfo2 = await WIRG.methods.getGameInfo(
        ).call(
            {from: gameCreatorAddress, gas: 4000000,gasPrice: 1});
        assert.equal('600000000000000000', gameInfo2.o_biggestContribution);
        assert.equal(parseInt(gameInfo.o_gameBalance) + 600000000000000000, gameInfo2.o_gameBalance);
        assert.equal(gameOpponentAddress, gameInfo2.o_richerUser);
    });

    it('checkEndGameFromSend', async () => {
        const gameInfo = await WIRG.methods.getGameInfo(
        ).call(
            {from: gameOpponentAddress_2, gas: 4000000,gasPrice: 1});
        assert.equal(gameInfo.o_gameEnd, false);
        await wait(60000);
            await web3.eth.sendTransaction({
                from: gameOpponentAddress_2,
                to: WIRG.options.address,
                gas: 4000000,
               gasPrice: 1,
                value: '100000000000000000'
            });

        const gameInfo2 = await WIRG.methods.getGameInfo(
        ).call(
            {from: gameOpponentAddress_2, gas: 4000000,gasPrice: 1});
        assert.equal(gameInfo2.o_gameEnd, true);
        assert.equal(gameInfo2.o_richerUser, gameInfo.o_richerUser);
        assert.equal(gameInfo2.o_richerUser, gameOpponentAddress);
    });


    it('checkGetWithdrawal', async () => {
        const richerBalance = await web3.eth.getBalance(
            gameOpponentAddress);
        const eventWithdrawal = await WIRG.methods.getWithdrawal(
        ).send(
            {from: gameOpponentAddress, gas: 4000000, gasPrice: 1});
        //assert.equal(eventWithdrawal.returnValues.amount, currentBalance);
        await wait(5000);
        const richerBalance2 = await web3.eth.getBalance(
            gameOpponentAddress);
        assert.equal(
            web3.utils.toBN(richerBalance).add(web3.utils.toBN(eventWithdrawal.events.LogWithdrawal.returnValues.amount)).toString(),
            web3.utils.toBN(richerBalance2).add(web3.utils.toBN(eventWithdrawal.cumulativeGasUsed)).toString());

    });


    it('check sending eth by restartGame function', async () => {
        const currentBalance = await web3.eth.getBalance(
            WIRG.options.address);

        const gameInfo = await WIRG.methods.getGameInfo(
        ).call(
            {from: gameOpponentAddress_2, gas: 4000000,gasPrice: 1});
        assert.equal(gameInfo.o_gameEnd, true);

        await WIRG.methods.restartGame(
        ).send(
            {from: gameOpponentAddress_2, gas: 4000000,gasPrice: 1, value: '500000000000000000' });

        const gameInfoAfterSend = await WIRG.methods.getGameInfo(
        ).call(
            {from: gameOpponentAddress_2, gas: 4000000,gasPrice: 1});
        assert.equal(gameInfoAfterSend.o_gameEnd, true);
        assert.equal(gameInfo.o_richerUser, gameInfoAfterSend.o_richerUser);

        const balanceAfterSend = await web3.eth.getBalance(
            WIRG.options.address);
        assert.equal(web3.utils.toBN(currentBalance).add(web3.utils.toBN('500000000000000000')).toString(),
            web3.utils.toBN(balanceAfterSend).toString());

    });

    it('check sending eth and NOT Restart by restartGame function', async () => {
        const currentBalance = await web3.eth.getBalance(
            WIRG.options.address);

        const gameInfo = await WIRG.methods.getGameInfo(
        ).call(
            {from: gameOpponentAddress_2, gas: 4000000,gasPrice: 1});
        assert.equal(gameInfo.o_gameEnd, true);
        const newRate = web3.utils.toBN(gameInfo.o_biggestContribution).add(web3.utils.toBN('500000000000000000')).toString();
        await WIRG.methods.restartGame(
        ).send(
            {from: gameOpponentAddress_2, gas: 4000000,gasPrice: 1, value: newRate });

        const gameInfoAfterSend = await WIRG.methods.getGameInfo(
        ).call(
            {from: gameOpponentAddress_2, gas: 4000000,gasPrice: 1});
        assert.equal(gameInfoAfterSend.o_gameEnd, true);
        assert.equal(gameInfo.o_richerUser, gameInfoAfterSend.o_richerUser);

        const balanceAfterSend = await web3.eth.getBalance(
            WIRG.options.address);
        assert.equal(web3.utils.toBN(currentBalance).add(web3.utils.toBN(newRate)).toString(),
            web3.utils.toBN(balanceAfterSend).toString());

    });

    it('check sending eth and Restart game', async () => {
        await wait(60000);
        const currentBalance = await web3.eth.getBalance(
            WIRG.options.address);

        const gameInfo = await WIRG.methods.getGameInfo(
        ).call(
            {from: gameOpponentAddress_2, gas: 4000000,gasPrice: 1});
        assert.equal(gameInfo.o_gameEnd, true);
        const newRate = web3.utils.toBN(gameInfo.o_biggestContribution).add(web3.utils.toBN('500000000000000000')).toString();
        await WIRG.methods.restartGame(
        ).send(
            {from: gameOpponentAddress_2, gas: 4000000,gasPrice: 1, value: newRate });

        const gameInfoAfterSend = await WIRG.methods.getGameInfo(
        ).call(
            {from: gameOpponentAddress_2, gas: 4000000,gasPrice: 1});
        assert.equal(gameInfoAfterSend.o_gameEnd, false);
        assert.equal(gameInfoAfterSend.o_richerUser, gameOpponentAddress_2);

        const balanceAfterSend = await web3.eth.getBalance(
            WIRG.options.address);
        assert.equal(web3.utils.toBN(currentBalance).add(web3.utils.toBN(newRate)).toString(),
            web3.utils.toBN(balanceAfterSend).toString());

    });

});
