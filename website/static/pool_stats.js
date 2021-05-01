/*
Copyright 2021 JAMPS (jamps.pro)

Authors: Olaf Wasilewski (olaf.wasilewski@gmx.de)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var poolHashrateChart;
var poolWorkerChart;
var networkDifficultyChart;
var networkHashrateChart;
function displayCharts() {
	var stats = getPoolStats(poolName);
	var maxScale = getReadableHashratePair(Math.max.apply(null, stats.hashrate.map(x => x[1])));
	var maxScaleDiff = getReadableNetworkDiffPair(Math.max.apply(null, stats.networkDiff.map(x => x[1])));
	var maxScaleHash = getReadableNetworkHashPair(Math.max.apply(null, stats.networkSols.map(x => x[1])));
	poolHashrateChart = createDefaultLineChart(document.getElementById("poolHashrateChart").getContext('2d'),
		[{
			label: 'Pool Hashrate',
			fill: true,
			data: stats.hashrate.map(x => {
				return {
					t: x[0],
					y: getScaledHashrate(x[1],maxScale[2])
				}
			}),
			borderWidth: 2,
			backgroundColor: 'rgba(101,157,189,0.3)',
			borderColor: '#659dd6'
		}],
		'Time',
		maxScale[1]
	);
	poolWorkerChart = createLineChart(document.getElementById("poolWorkerChart").getContext('2d'),
		[{
			label: 'Actual Workers',
			fill: true,
			data: stats.workers.map(x => {
				return {
					t: x[0],
					y: x[1]
				}
			}),
			borderWidth: 2,
			backgroundColor: 'rgba(101,157,189,0.3)',
			borderColor: '#659dd6'
		}],
		'Time',
		'Workers',
		{
			beginAtZero: true,
			fixedStepSize: 1
		}
	);
	networkDifficultyChart = createDefaultLineChart(document.getElementById("networkDifficultyChart").getContext('2d'),
		[{
			label: 'Network Difficulty',
			fill: true,
			data: stats.networkDiff.map(x => {
				return {
					t: x[0],
					y: getReadableNetworkDiff(x[1],maxScaleDiff[2])
				}
			}),
			borderWidth: 2,
			backgroundColor: 'rgba(101,157,189,0.3)',
			borderColor: '#659dd6'
		}],
		'Time',
		maxScaleDiff[1]
	);
	networkHashrateChart = createDefaultLineChart(document.getElementById("networkHashrateChart").getContext('2d'),
		[{
			label: 'Network Hashrate',
			fill: true,
			data: stats.networkSols.map(x => {
				return {
					t: x[0],
					y: getReadableNetworkHash(x[1],maxScaleHash[2])
				}
			}),
			borderWidth: 2,
			backgroundColor: 'rgba(101,157,189,0.3)',
			borderColor: '#659dd6'
		}],
		'Time',
		maxScaleHash[1]
	);
}
$.getJSON('/api/pool_stats', function(data) {
	if (document.hidden) return;
	addPoolToTracker(data, poolName, function() {
		displayCharts();
	});
});
statsSource.addEventListener('message', function(e) {
	var stats = JSON.parse(e.data);
	updatePoolData(stats, poolName, function(pool) {
		var time = stats.time * 1000;
		var poolDiff = stats.pools[poolName].networkDiff;
		var luck = (poolName in stats.pools ? stats.pools[poolName].luckHours : 0);
		var hash = getScaledHashrate(poolName in stats.pools ? stats.pools[poolName].hashrate : 0, pair[2]);
		var diff = getScaledNetworkDiff(poolName in stats.pools ? stats.pools[poolName].poolStats.networkDiff : 0, pair[2]);
		var sols = getScaledNetworkHash(poolName in stats.pools ? stats.pools[poolName].poolStats.networkSols : 0, pair[2]);
		var max = Math.max.apply(null, pool.hashrate.map(x => x[1]));
		var maxDiff = Math.max.apply(null, pool.networkDiff.map(x => x[1]));
		var maxSols = Math.max.apply(null, pool.networkSols.map(x => x[1]));
		var pair = getReadableHashratePair(max);
		var pairDiff = getReadableNetworkDiffPair(maxDiff);
		var pairSols = getReadableNetworkHashPair(maxSols);
		var scaled = getScaledHashrate(max);
		var scaledDiff = getScaledNetworkDiff(maxDiff);
		var scaledSols = getScaledNetworkHash(maxSols);
		var networkPercent = (poolName in stats.pools ? stats.pools[poolName].hashrate : 0) / (poolName in stats.pools ? stats.pools[poolName].poolStats.networkSols : 0);
		$("#validShares").text(poolName in stats.pools ? stats.pools[poolName].poolStats.validShares : 0);
		$("#poolHashRate").text((!isNaN(hash) ? hash : 0) + ' ' + (pair[1] ? pair[1] : 'H/s'));
		$("#poolMiners").text(poolName in stats.pools ? stats.pools[poolName].minerCount : 0);
		$("#poolWorkers").text(poolName in stats.pools ? stats.pools[poolName].workerCount : 0);
		$("#pendingBlocks").text(poolName in stats.pools ? stats.pools[poolName].blocks.pending : 0);
		$("#confirmedBlocks").text(poolName in stats.pools ? stats.pools[poolName].blocks.confirmed : 0);
		$("#currentRoundShares").text(poolName in stats.pools ? stats.pools[poolName].currentRoundTimeString : 0);
		$("#timeToFind").text(poolName in stats.pools ? stats.pools[poolName].timeToFind : 0);
		$("#currentEffort").text(poolName in stats.pools ? Number(stats.pools[poolName].currEffort * 100).toFixed(2) + ' %' : 0);
		$("#netHash").text(poolName in stats.pools ? stats.pools[poolName].networkHashrateString : 0);
		$("#netDiff").text(poolName in stats.pools ? stats.pools[poolName].networkDifficultyString : 0);
		$("#netHeight").text(poolName in stats.pools ? stats.pools[poolName].poolStats.networkBlocks : 0);
		$("#netPeers").text(poolName in stats.pools ? stats.pools[poolName].poolStats.networkConnections : 0);
		$("#luckHour").text(poolName in stats.pools ? stats.pools[poolName].luckHours + ' Hours' : 0);
		$("#lastBlockTime").text(poolName in stats.pools ? stats.pools[poolName].lastBlockDate : 0);
		$("#totalPaid").text(poolName in stats.pools ? Number(stats.pools[poolName].poolStats.totalPaid).toFixed(0) + ' ' + stats.pools[poolName].symbol : 0);
		$("#minPayment").text(poolName in stats.pools ? stats.pools[poolName].minimumPayment + ' ' + stats.pools[poolName].symbol : 0);
		$("#intPayment").text(poolName in stats.pools ? stats.pools[poolName].intervalPayment : 0);
		$("#netPercent").text((parseFloat(networkPercent * 100)).toFixed(2) + ' %');
	});
}, false);
$.getJSON("https://api.coingecko.com/api/v3/coins/ravencoin", function (data) {
	$("#CoinToUSD").html("$ " + data.market_data.current_price.usd.toFixed(4));
	$("#CoinToBTC").html(data.market_data.current_price.btc.toFixed(8));
	$("#priceHigh").html("$ " + data.market_data.high_24h.usd.toFixed(4));
	$("#priceLow").html("$ " + data.market_data.low_24h.usd.toFixed(4));
});