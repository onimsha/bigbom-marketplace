class Utils {
    getNetwork(netId) {
        switch (netId) {
            case '1':
                return 'MAINNET';
            case '2':
                return 'MORDEN';
            case '3':
                return 'ROPSTEN';
            case '4':
                return 'RINKEBY';
            case '42':
                return 'KOVAN';
            case '89':
                return 'TOMOCHAIN';
            default:
                return 'UNKNOW';
        }
    }

    callMethod(_method) {
        return (...param) => {
            return new Promise(resolve => {
                _method(...param, (error, result) => {
                    resolve([error, result]);
                });
            });
        };
    }

    callMethodWithReject(_method) {
        return (...param) => {
            return new Promise((resolve, reject) => {
                _method(...param, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            });
        };
    }

    callAllMethodWithReject(promises) {
        return new Promise(async resolve => {
            let result = await Promise.all(promises);
            let error = null;
            result = result.map(item => {
                const [e, r] = item;
                e && !error && (error = e);
                return r;
            });

            if (error) {
                resolve([error, null]);
            } else {
                resolve([null, result]);
            }
        });
    }

    callAllMethod(promises) {
        return new Promise(async resolve => {
            try {
                const result = await Promise.all(promises);
                resolve([null, result]);
            } catch (error) {
                resolve([error, null]);
            }
        });
    }

    truncate = (fullStr, strLen, separator) => {
        if (fullStr.length <= strLen) return fullStr;
        separator = separator || '...';
        var sepLen = separator.length,
            charsToShow = strLen - sepLen,
            frontChars = Math.ceil(charsToShow / 2),
            backChars = Math.floor(charsToShow / 2);

        return fullStr.substr(0, frontChars) + separator + fullStr.substr(fullStr.length - backChars);
    };

    getStatusJobOpen = bid => {
        for (let b of bid) {
            if (b.accepted) {
                return false;
            }
        }
        return true;
    };

    getStatus(jobStatusLog) {
        // [owner, expired, budget, cancel, status, freelancer]
        let bidAccepted = jobStatusLog[5] !== '0x0000000000000000000000000000000000000000';
        const stt = {
            started: Number(jobStatusLog[4].toString()) === 1,
            completed: Number(jobStatusLog[4].toString()) === 2,
            claimed: Number(jobStatusLog[4].toString()) === 5,
            reject: Number(jobStatusLog[4].toString()) === 4,
            paymentAccepted: Number(jobStatusLog[4].toString()) === 9,
            canceled: jobStatusLog[3],
            bidAccepted: bidAccepted,
            bidding: this.getBiddingStt(jobStatusLog),
            expired: false,
            waiting: !this.getBiddingStt(jobStatusLog) && !bidAccepted,
        };
        if (stt.started || stt.completed || stt.claimed || stt.reject || stt.paymentAccepted) {
            stt.bidAccepted = false;
        }
        return stt;
    }

    getStatusJob = all => {
        if (all.canceled) {
            return ['Canceled'];
        } else if (all.expired) {
            return ['Expired'];
        } else if (all.bidding) {
            return ['Bidding'];
        } else if (all.bidAccepted) {
            return ['Bid Accepted'];
        } else if (all.started) {
            return ['Started'];
        } else if (all.completed) {
            return ['Completed'];
        } else if (all.paymentAccepted) {
            return ['Payment Accepted'];
        } else if (all.reject) {
            return ['Rejected'];
        } else if (all.claimed) {
            return ['Claimed'];
        } else if (all.waiting) {
            return ['Waiting'];
        }
    };

    getBiddingStt(stts) {
        // [owner, expired, budget, cancel, status, freelancer]
        if (stts[3]) {
            return false;
        } else if (Number(stts[1].toString()) <= Math.floor(Date.now() / 1000) ? true : false) {
            return false;
        } else if (stts[5] !== '0x0000000000000000000000000000000000000000') {
            return false;
        }
        return true;
    }

    avgBid = bids => {
        let total = 0;
        if (bids.length > 0) {
            for (let b of bids) {
                total += Number(b.award);
            }
            if (!Number.isInteger(total / bids.length)) {
                return (total / bids.length).toFixed(2);
            }
            return total / bids.length;
        } else {
            return NaN;
        }
    };

    async connectMetaMask(web3, ignoreNetwork = ['MAINNET']) {
        if (!web3) {
            throw new Error(
                JSON.stringify({
                    code: 'INSTALL',
                    message: 'You need to install Metamask first!',
                })
            );
        } else {
            let [err, netId] = await this.callMethod(web3.version.getNetwork)();
            if (err) {
                throw new Error(
                    JSON.stringify({
                        code: 'NETWORK',
                        message: err,
                    })
                );
            } else if (ignoreNetwork.includes(this.getNetwork(netId))) {
                throw new Error(
                    JSON.stringify({
                        code: 'CONNECT_NETWORK',
                        message: 'Please choose TESTNET',
                    })
                );
            } else {
                let [err, accounts] = await this.callMethod(web3.eth.getAccounts)();
                if (err) {
                    throw new Error(
                        JSON.stringify({
                            code: 'NETWORK',
                            message: err,
                        })
                    );
                } else {
                    if (accounts.length > 0) {
                        return {
                            account: web3.eth.defaultAccount,
                            network: netId,
                        };
                    } else {
                        throw new Error(
                            JSON.stringify({
                                code: 'CONNECT_WALLET',
                                message: 'Please login Metamask!',
                            })
                        );
                    }
                }
            }
        }
    }

    isWalletAddress(walletAddress) {
        const regexWalletAdress = /^(0x)?[0-9a-f]{40}$/i;
        return walletAddress ? regexWalletAdress.test(walletAddress.trim()) : false;
    }

    toAscii(hex) {
        // Find termination
        var str = '';
        var i = 0,
            l = hex.length;
        if (hex.substring(0, 2) === '0x') {
            i = 2;
        }
        for (; i < l; i += 2) {
            var code = parseInt(hex.substr(i, 2), 16);
            if (code === 0) {
                break;
            }
            str += String.fromCharCode(code);
        }
        return str;
    }
}

export default new Utils();
