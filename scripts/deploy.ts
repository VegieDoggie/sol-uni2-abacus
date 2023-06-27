import {ethers, upgrades} from "hardhat";


// 部署脚本
(async ()=>{
    const Abacus = await ethers.getContractFactory("Abacus");
    let weth = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
    let instance = await upgrades.deployProxy(Abacus,[weth]);
    console.log(instance.address)
})()
