JAMPS Ravencoin Pool - v1.0.0 Special Edition
================

[![License](https://img.shields.io/badge/license-GPL--3.0-blue)](https://opensource.org/licenses/GPL-3.0)

Highly Efficient mining pool for Ravencoin!

-------
### Screenshots
#### Home<br />
![Home](https://raw.githubusercontent.com/J-A-M-P-S/jamps-ravencoin-pool/master/docs/frontend/home.png)

-------
### Node Open Mining Portal consists of 3 main modules:
| Project | Link |
| ------------- | ------------- |
| [JAMPS Ravencoin Pool]
| [JAMPS Ravencoin Stratum]
| [JAMPS Ravencoin Hashing]

-------
### Requirements
***NOTE:*** _These requirements will be installed in the install section!_<br />
* Ubuntu Server 18.04.* LTS
* Coin daemon
* Node Version Manager
* Node 8.1.7
* Process Manager 2 / pm2
* Redis Server
* ntp

-------

### Install RavenCoin Daemon

    adduser pool
    usermod -aG sudo pool
    su - pool
    sudo apt install wget
    wget https://github.com/RavenProject/Ravencoin/releases/download/v4.3.2.1/raven-4.3.2.1-x86_64-linux-gnu.zip
    unzip raven-4.3.2.1-x86_64-linux-gnu.zip
    rm raven*zip
    cd linux
    tar -xvf raven-4.3.2.1-x86_64-linux-gnu.tar.gz
    rm raven*gz
    cd raven-4.3.2.1/bin
    mkdir -p ~/.raven/
    touch ~/.raven/raven.conf
    echo "rpcuser=user1" > ~/.raven/raven.conf
    echo "rpcpassword=pass1" >> ~/.raven/raven.conf
    echo "prune=550" >> ~/.raven/raven.conf
    echo "daemon=1" >> ~/.raven/raven.conf
    ./ravend
    ./raven-cli getnewaddress

Example output: RNs3ne88DoNEnXFTqUrj6zrYejeQpcj4jk - it is the address of your pool, you need to remember it and specify it in the configuration file pool_configs/ravencoin.json.
    
    ./raven-cli getaddressesbyaccount ""
    
Information about pool wallet address.
    
    ./raven-cli getwalletinfo
    
Get more information.

    ./raven-cli getblockcount
    
Information about synchronization of blocks in the main chain.

    ./raven-cli help
Other helpfull commands.

-------

### Install Pool

    sudo apt install git -y
    cd ~
    git config --global http.https://gopkg.in.followRedirects true
    git clone https://github.com/J-A-M-P-S/jamps-ravencoin-pool.git
    cd jamps-ravencoin-pool/
    ./install.sh

-------
### Configure Pool

Change "stratumHost": "rvn.jamps.pro", to your IP or DNS in file config.json:

    cd ~/jamps-ravencoin-pool
    nano config.json

```javascript
{
    "poolname": "Ravncoin Pool",
    "devmode": false,
    "devmodePayMinimim": 0.25,
    "devmodePayInterval": 120,
    "logips": true,       
    "anonymizeips": true,
    "ipv4bits": 16,
    "ipv6bits": 16,
    "defaultCoin": "ravencoin",
    "poollogo": "/website/static/img/poollogo.png",
    "discord": "Join our #mining channel on Discord: ",
    "discordlink": "https://discord.gg/vzcbVNW",
    "pagetitle": "Ravencoin Pool - 0.5 % Fees Promo - Run By Professionals",
    "pageauthor": "JAMPS",
    "pagedesc": "A reliable, low fee, easy to use mining pool for Ravencoin! Get started mining today!",
    "pagekeywds": "GPU,CPU,Hash,Hashrate,Cryptocurrency,Crypto,Mining,Pool,Ravencoin,Easy,Simple,How,To",
    "btcdonations": "1GXEm97T5iXAeYHBj2GuL3TKKRpkNas4Qt",
    "ltcdonations": "LWBZWLmjqeQFnMqS9NctcdSx3TEYHyzfGz",
    "rvndonations": "RNs3ne88DoNEnXFTqUrj6zrYejeQpcj4jk",
    "logger" : {
        "level" : "debug",
        "file" : "/home/pool/jamps-ravencoin-pool/logs/ravencoin_debug.log"
    },
    "cliHost": "127.0.0.1",
    "cliPort": 17117,
    "clustering": {
        "enabled": false,
        "forks": "auto"
    },
    "defaultPoolConfigs": {
        "blockRefreshInterval": 400,
        "jobRebroadcastTimeout": 25,
        "connectionTimeout": 600,
        "emitInvalidBlockHashes": false,
        "validateWorkerUsername": true,
        "tcpProxyProtocol": false,
        "banning": {
            "enabled": true,
            "time": 600,
            "invalidPercent": 50,
            "checkThreshold": 500,
            "purgeInterval": 300
        },
        "redis": {
            "host": "127.0.0.1",
            "port": 6379
        }
    },
    "website": {
        "enabled": true,
        "sslenabled": false,
        "sslforced": false,
        "host": "0.0.0.0",
        "port": 80,
        "sslport": 443,
        "sslkey": "/home/pool/jamps-ravencoin-pool/certs/privkey.pem",
        "sslcert": "/home/pool/jamps-ravencoin-pool/certs/fullchain.pem",
        "stratumHost": "rvn.jamps.pro",
        "stats": {
            "updateInterval": 900,
            "historicalRetention": 43200,
            "hashrateWindow": 900
        }
    },
    "redis": {
        "host": "127.0.0.1",
        "port": 6379
    }
}

```

Change "address": "RNs3ne88DoNEnXFTqUrj6zrYejeQpcj4jk", to your pool created wallet address in file ravencoin.json:

    cd ~/jamps-ravencoin-pool/pools
    nano ravencoin.json

```javascript
{
    "enabled": true,
    "coin": "ravencoin.json",
    "address": "RNs3ne88DoNEnXFTqUrj6zrYejeQpcj4jk",
    "donateaddress": "RNs3ne88DoNEnXFTqUrj6zrYejeQpcj4jk",
    "rewardRecipients": {
        "RNs3ne88DoNEnXFTqUrj6zrYejeQpcj4jk": 0.5
    },
    "paymentProcessing": {
        "enabled": true,
        "schema": "PROP",
        "paymentInterval": 300,
        "minimumPayment": 1,
        "maxBlocksPerPayment": 1,
        "minConf": 30,
        "coinPrecision": 8,
        "daemon": {
            "host": "127.0.0.1",
            "port": 8766,
            "user": "user1",
            "password": "pass1"
        }
    },
    "ports": {
	"10008": {
            "diff": 0.05,
    	    "varDiff": {
    	        "minDiff": 0.025,
    	        "maxDiff": 1024,
    	        "targetTime": 10,
    	        "retargetTime": 60,
    	        "variancePercent": 30,
    		"maxJump": 25
    	    }
        },
        "10016": {
	    "diff": 0.10,
            "varDiff": {
                "minDiff": 0.05,
                "maxDiff": 1024,
    	        "targetTime": 10,
    	        "retargetTime": 60,
    	        "variancePercent": 30,
		"maxJump": 25
            }
        },
        "10032": {
	    "diff": 0.20,
            "varDiff": {
    		"minDiff": 0.10,
    		"maxDiff": 1024,
    	        "targetTime": 10,
    	        "retargetTime": 60,
    	        "variancePercent": 30,
    		"maxJump": 50
    	    }
        },
	"10256": {
	    "diff": 1024000000,
            "varDiff": {
                "minDiff": 1024000000,
                "maxDiff": 20480000000,
    	        "targetTime": 10,
    	        "retargetTime": 60,
    	        "variancePercent": 30,
		"maxJump": 25
            }
        }
    },
    "daemons": [
        {
            "host": "127.0.0.1",
            "port": 8766,
            "user": "user1",
            "password": "pass1"
        }
    ],
    "p2p": {
        "enabled": false,
        "host": "127.0.0.1",
        "port": 8767,
        "disableTransactions": true
    },
    "mposMode": {
        "enabled": false,
        "host": "127.0.0.1",
        "port": 3306,
        "user": "me",
        "password": "mypass",
        "database": "rvn",
        "checkPassword": true,
        "autoCreateWorker": false
    }
}

```

### Run Pool
    
    cd ~/jamps-ravencoin-pool
    sudo bash pool-start.sh

### Donates for developers JAMPS Ravencoin Pool

BTC: 1GXEm97T5iXAeYHBj2GuL3TKKRpkNas4Qt

LTC: LWBZWLmjqeQFnMqS9NctcdSx3TEYHyzfGz

RVN: RNs3ne88DoNEnXFTqUrj6zrYejeQpcj4jk
    
-------

## License
```
Licensed under the GPL-3.0
Copyright (c) 2021 JAMPS
```
