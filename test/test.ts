import Web3 from "web3";
import {Contract} from "web3-eth-contract";

class Abacus {
    web3: Web3
    abacus: Contract
    from: string | undefined
    weth: string
    router: string

    constructor(rpc: string, router: string, abacusAddress: string, weth: string, from ?: string) {
        this.web3 = new Web3(rpc)
        this.from = from
        this.abacus = new this.web3.eth.Contract(this.abi, abacusAddress)
        this.weth = weth
        this.router = router
    }

    check = async (value: bigint, token: string, amount: bigint) => {
        let callReq = this.abacus.methods["check"]([this.weth, token], this.router, amount).encodeABI();
        let callRes = await this.web3.eth.call({
            from: this.from ?? "0x0000000000000000000000000000000000001004",
            to: this.abacus.options.address,
            value: value.toString(),
            data: callReq
        });
        let data = this.web3.eth.abi.decodeParameters(this.outputs, callRes);
        return {
            errcode: data.errcode,
            buy: this.feeRatio(data.fees[2]),
            sell: this.feeRatio(data.fees[0]),
            router: this.feeRatio(data.fees[1]),
        }
    }

    feeRatio = (BP: number) => {
        return ((10000 - BP) / 100).toFixed(2)
    }

    abi:any = [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"address","name":"WETH","type":"address"}],"name":"SetWETH","type":"event"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"router","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"check","outputs":[{"internalType":"uint256[]","name":"fees","type":"uint256[]"},{"internalType":"uint256","name":"errcode","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"router","type":"address"},{"internalType":"address","name":"pair","type":"address"},{"internalType":"uint256","name":"fee1","type":"uint256"},{"internalType":"uint256","name":"amountIn","type":"uint256"}],"name":"checkBuy","outputs":[{"internalType":"uint256","name":"fee","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"router","type":"address"},{"internalType":"address","name":"pair","type":"address"}],"name":"checkRouter","outputs":[{"internalType":"uint256","name":"fee","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"router","type":"address"},{"internalType":"address","name":"pair","type":"address"},{"internalType":"uint256","name":"fee1","type":"uint256"}],"name":"checkSell","outputs":[{"internalType":"uint256","name":"fee","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"weth","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"weth","type":"address"}],"name":"setWETH","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]
    outputs:any =[
        { internalType: 'uint256[]', name: 'fees', type: 'uint256[]' },
        { internalType: 'uint256', name: 'errcode', type: 'uint256' }
    ]
}

(async () => {
    const config = {
        Rpc: "https://data-seed-prebsc-1-s1.binance.org:8545",
        User: "0x0000000000000000000000000000000000001004",
        WETH: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
        BUSD: "0xaB1a4d4f1D656d2450692D237fdD6C7f9146e814",
        CAKE: "0xFa60D973F7642B748046464e165A65B7323b0DEE",
        Router: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
        Abacus: "0xbb01b1d4d770ad9caff46ef8f985a020daac8377",
    };
    let abacus = new Abacus(config.Rpc, config.Router, config.Abacus, config.WETH);
    let res = await abacus.check(2n * 10n ** 18n, config.CAKE, 10n ** 17n)
    console.log(`错误: ${res.errcode == 0 ? "无" : res.errcode} \n买税: ${res.buy}% 卖税: ${res.sell}% 路由税: ${res.router}%`);
})();