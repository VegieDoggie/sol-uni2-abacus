// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "./interfaces/IWETH.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Abacus is OwnableUpgradeable {
    event SetWETH(address user, address WETH);

    address public WETH;

    function initialize(address weth) public initializer {
        __Ownable_init();
        WETH = weth;
    }

    function setWETH(address weth) external onlyOwner {
        WETH = weth;
        emit SetWETH(owner(), weth);
    }

    function check(address[] memory path, address router, uint256 amount) external payable returns (uint256[] memory fees, uint256 errcode) {
        require(path.length == 2, "Must 2 Tokens");
        IWETH(WETH).deposit{value: msg.value}();
        IERC20(WETH).approve(router, type(uint256).max);
        if (path[0] != WETH) {
            address[] memory _path = new address[](2);
            (_path[0], _path[1]) = (WETH, path[0]);
            IUniswapV2Router02(router).swapETHForExactTokens(amount, _path, address(this), 15 minutes + block.timestamp);
        }
        fees = new uint[](3);
        address pair = IUniswapV2Factory(IUniswapV2Router02(router).factory()).getPair(path[0], path[1]);
        (bool success, bytes memory data) = address(this).call(abi.encodeWithSelector(0x44c0156f, path, router, pair));
        if (success) {
            fees[1] = abi.decode(data, (uint256));
            (success, data) = address(this).call(abi.encodeWithSelector(0xbae84bd2, path, router, pair, fees[1], amount));
            if (success) {
                fees[2] = abi.decode(data, (uint256));
                (success, data) = address(this).call(abi.encodeWithSelector(0xe149d232, path, router, pair, fees[1]));
                if (success) fees[0] = abi.decode(data, (uint256));
                else errcode = 3;
            } else errcode = 2;
        } else errcode = 1;
        return (fees, errcode);
    }

    function checkRouter(address[] memory path, address router, address pair) external view returns (uint256 fee){
        uint256 amountIn = IUniswapV2Router02(router).getAmountsIn(100000, path)[0];
        uint256 actualOut = IUniswapV2Router02(router).getAmountsOut(amountIn, path)[1] + 1;

        (uint256 reserveIn, uint256 reserveOut,) = IUniswapV2Pair(pair).getReserves();
        if (IUniswapV2Pair(pair).token0() != path[0]) (reserveIn, reserveOut) = (reserveOut, reserveIn);

        return (reserveIn * actualOut * 10000) / (amountIn * (reserveOut - actualOut));
    }

    // path - [quote, token]
    // "e149d232": "checkSell(address[],address,address,uint256)"
    function checkSell(address[] memory path, address router, address pair, uint256 fee1) external returns (uint256 fee) {
        (path[0], path[1]) = (path[1], path[0]);

        uint256 amountIn = IERC20(path[0]).balanceOf(address(this));

        (uint256 reserveIn, uint256 reserveOut,) = IUniswapV2Pair(pair).getReserves();
        if (IUniswapV2Pair(pair).token0() != path[0]) (reserveIn, reserveOut) = (reserveOut, reserveIn);

        IERC20(path[0]).approve(router, amountIn);
        uint256 beforeBalance = IERC20(path[1]).balanceOf(address(this));
        IUniswapV2Router02(router).swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn, 0, path, address(this), 15 minutes + block.timestamp);
        uint256 actualOut = IERC20(path[1]).balanceOf(address(this)) - beforeBalance + 1;

        return (reserveIn * actualOut * 10000 * 10000) / (fee1 * amountIn * (reserveOut - actualOut));
    }

    // path - [quote, token]
    // "bae84bd2": "checkBuy(address[],address,address,uint256,uint256)",
    function checkBuy(address[] memory path, address router, address pair, uint256 fee1, uint256 amountIn) external returns (uint256 fee) {
        (uint256 reserveIn, uint256 reserveOut,) = IUniswapV2Pair(pair).getReserves();
        if (IUniswapV2Pair(pair).token0() != path[0]) (reserveIn, reserveOut) = (reserveOut, reserveIn);
        IERC20(path[0]).approve(router, amountIn);
        uint256 beforeBalance = IERC20(path[1]).balanceOf(address(this));
        IUniswapV2Router02(router).swapExactTokensForTokensSupportingFeeOnTransferTokens(amountIn, 0, path, address(this), 15 minutes + block.timestamp);
        uint256 actualOut = IERC20(path[1]).balanceOf(address(this)) - beforeBalance + 1;

        return (actualOut * (10000 * reserveIn + fee1 * amountIn) * 10000) / (fee1 * amountIn * reserveOut);
    }
}