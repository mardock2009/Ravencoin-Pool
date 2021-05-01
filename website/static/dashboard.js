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

var statData;
var poolKeys;
$(function() {
	var dataTable = $("#walletTable").DataTable({
		"bFilter": false,
		"bInfo" : false,
		"order": [[ 0, "desc" ]],
		"bLengthChange": false,
		"iDisplayLength": 10,
		"height": 200,
		"pageLength": 10,
		"pagingType": "full_numbers",
		"lengthMenu": [ 25, 50, 100, 150, 300, 500 ]
	});
	var cachedWallets = Cookies.get('wallets');
	if(cachedWallets && cachedWallets.length > 0) {
		cachedWallets = JSON.parse(cachedWallets);
		for(w in cachedWallets) {
			var wallet = cachedWallets[w].split(',');
			var coin = wallet[0];
			var address = wallet[1];
			dataTable.row.add([
				"<a href=\"/workers/" + address + "\"><img src=\"./static/icons/" + coin + ".png\" height=\"25px\"/> " + address + "</a>",
				"<button id=\"" + address + "\" type=\"button\" class=\"btn btn-outline-danger btn-sm\"><i class=\"fa fa-trash\"></i> Delete&nbsp;</button></td>"
			]).draw(false);
			$('#' + address).click(function(event) {
				if(confirm("Are you sure you want to delete address: " + address)) {
					cachedWallets.splice(w, 1);
					Cookies.remove('wallets');
					Cookies.set('wallets', cachedWallets, { expires: 30 });
					location.reload();
				}
			});
		}
	}
	$('#searchButton').click(myFormOnSubmit);
	function myFormOnSubmit(event) {
		var f = $(this);
		var search = $('#searchBar').val();
		var isValid = false;
		var coin = "";
		var wallets = Cookies.get('wallets');
		var stored = false;
		if(wallets) {
			wallets = JSON.parse(wallets);
			for(w in wallets) {
				if(wallets[w].split(',')[1] === search) {
					stored = true;
					break;
				}
			}
		}
		if(stored) {
			alert('Address Already Stored!');
			event.preventDefault();
			return;
		}
		if(!wallets) {
			wallets = [];
		}
		$.each(statData.pools, function(i, v) {
			if(!isValid) {
				for(worker in v.workers) {
					worker = worker.split('.')[0];
					if(worker === search) {
						isValid = true;
						wallets.push(String(i + ',' + worker));
						break;
					}
				}
			}
		});
		if (!isValid) {
			alert('No Address Found!');
			event.preventDefault();
			return;
		} else {
			Cookies.remove('wallets');
			Cookies.set('wallets', wallets, { expires: 30 });
		}
	}
});
$.getJSON('/api/stats', function(data) {
	statData = data;
});