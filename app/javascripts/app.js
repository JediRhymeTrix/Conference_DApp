// Import the page's CSS. Webpack will know what to do with it.
import '../stylesheets/app.css'

// Import libraries we need.
import {
    default as Web3
} from 'web3'
import {
    default as contract
} from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import conference_artifacts from '../../build/contracts/Conference.json'

// Conference is our usable abstraction, which we'll use through the code below.
var Conference = contract(conference_artifacts)

var accounts, account, speaker
var conference

function getBalance(address) {
    return web3.fromWei(web3.eth.getBalance(address).toNumber(), 'ether')
}

window.App = {
    start: function() {
        var self = this

        web3.eth.getAccounts(function(err, accs) {
            if (err != null) {
                alert('There was an error fetching your accounts.')
                return
            }

            if (accs.length == 0) {
                alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.")
                return
            }

            accounts = accs
                // console.log(accounts);
            account = accounts[0]
            speaker = accounts[9]
            $('#orgBalance').html(getBalance(account))
            $('#speakerBalance').html(getBalance(speaker))
            self.initializeConference()
        })
    },

    initializeConference: function() {
        var self = this
        Conference.deployed().then(function(instance) {
            conference = instance
            $('#confAddress').html(conference.address)

            conference.location.call().then(
                function(location) {
                    $('#location').val(location)
                })
            self.checkValues()
        }).catch(function(e) {
            console.log(e)
        })
    },

    checkValues: function() {
        Conference.deployed().then(function(instance) {
            conference = instance
            conference.quota.call().then(
                function(quota) {
                    $('input#confQuota').val(quota)
                    return conference.organizer.call()
                }).then(
                function(organizer) {
                    console.log("organizer " + organizer);
                    $('input#confOrganizer').val(organizer)
                    return conference.numRegistrants.call()
                }).then(
                function(num) {
                    $('#numRegistrants').html(num.toNumber())
                    return getBalance(conference.address)
                }).then(
                function(balance) {
                    $('#confBalance').html(balance)
                    return conference.speaker.call()
                }).then(
                function(speaker) {
                    $('input#speakerAddress').val(speaker)
                })
        }).catch(function(e) {
            console.log(e)
        })
    },
    changeQuota: function(val) {
        var conference
        Conference.deployed().then(function(instance) {
            conference = instance
            conference.changeQuota(val, {
                from: accounts[0]
            }).then(
                function() {
                    return conference.quota.call()
                }).then(
                function(quota) {
                    var msgResult
                    if (quota == val) {
                        msgResult = 'Change successful'
                    } else {
                        msgResult = 'Change failed'
                    }
                    $('#changeQuotaResult').html(msgResult)
                })
        }).catch(function(e) {
            console.log(e)
        })
    },

    changeLocation: function(val) {
        var conference
        Conference.deployed().then(function(instance) {
            conference = instance
            conference.changeLocation(val, {
                from: accounts[0]
            }).then(
                function() {
                    return conference.location.call();
                }).then(
                function(location) {
                    var msgResult
                    if (location == val) {
                        msgResult = 'Change successful'
                        $('#location').val(val)
                    } else {
                        msgResult = 'Change failed'
                    }
                    $('#changeLocationResult').html(msgResult)
                })
        }).catch(function(e) {
            console.log(e)
        })
    },

    buyTicket: function(buyerAddress, ticketPrice) {
        var self = this
        Conference.deployed().then(function(instance) {
            conference = instance
            conference.buyTicket({
                from: buyerAddress,
                value: ticketPrice
            }).then(
                function() {
                    return conference.numRegistrants.call()
                }).then(
                function(num) {
                    $('#numRegistrants').html(num.toNumber())
                    return conference.registrantsPaid.call(buyerAddress)
                }).then(
                function(valuePaid) {
                    var msgResult
                    if (valuePaid.toNumber() == ticketPrice) {
                        msgResult = 'Purchase successful'
                    } else {
                        msgResult = 'Purchase failed'
                    }
                    $('#buyTicketResult').html(msgResult)
                }).then(
                function() {
                    $('#confBalance').html(getBalance(conference.address))
                })
        }).catch(function(e) {
            console.log(e)
        })
    },

    buyMultipleTickets: function(buyerAddress, ticketPrice, ticketcount) {
        var self = this
        Conference.deployed().then(function(instance) {
            conference = instance
            conference.buyMultipleTickets(ticketcount, {
                from: buyerAddress,
                value: ticketcount * ticketPrice
            }).then(
                function() {
                    return conference.numRegistrants.call()
                }).then(
                function(num) {
                    $('#numRegistrants').html(num.toNumber())
                    return conference.registrantsPaid.call(buyerAddress)
                }).then(
                function(valuePaid) {
                    var msgResult
                    if (valuePaid.toNumber() == ticketcount * ticketPrice) {
                        msgResult = 'Purchase successful'
                    } else {
                        msgResult = 'Purchase failed'
                    }
                    $('#buyTicketsResult').html(msgResult)
                }).then(
                function() {
                    $('#confBalance').html(getBalance(conference.address))
                })
        }).catch(function(e) {
            console.log(e)
        })
    },

    refundTicket: function(buyerAddress, ticketPrice) {
        var self = this
        Conference.deployed().then(function(instance) {
            conference = instance
            var msgResult

            conference.registrantsPaid.call(buyerAddress).then(
                function(result) {
                    if (result.toNumber() == 0) {
                        $('#refundTicketResult').html('Buyer is not registered - no refund!')
                    } else {
                        conference.refundTicket(buyerAddress,
                            ticketPrice, {
                                from: accounts[0]
                            }).then(
                            function() {
                                return conference.numRegistrants.call()
                            }).then(
                            function(num) {
                                $('#numRegistrants').html(num.toNumber())
                                return conference.registrantsPaid.call(buyerAddress)
                            }).then(
                            function(valuePaid) {
                                if (valuePaid.toNumber() == 0) {
                                    msgResult = 'Refund successful'
                                } else {
                                    msgResult = 'Refund failed'
                                }
                                $('#refundTicketResult').html(msgResult)
                            }).then(
                            function() {
                                $('#confBalance').html(getBalance(conference.address))
                            })
                    }
                })
        }).catch(function(e) {
            console.log(e)
        })
    }, // end of refund

    setRating: function(buyerAddress, rating) {
        var self = this
        var initial_rating
        Conference.deployed().then(function(instance) {
            conference = instance
            conference.ratings.call(rating)
                .then(
                    function(init_rat) {
                        console.log(init_rat)
                        initial_rating = init_rat.toNumber()
                    }).then(
                    conference.setRating(rating, {
                        from: buyerAddress,
                    })).then(
                    function() {
                        return conference.ratings.call(rating)
                            .then(
                                function(contract_rating) {
                                    var msgResult
                                    console.log(contract_rating.toNumber())
                                    if (contract_rating.toNumber() - initial_rating == 1) {
                                        msgResult = 'Rating submitted'
                                        $.drawRatingGraph()
                                    } else {
                                        msgResult = 'Rating submission failed'
                                    }
                                    $('#ratingResult').html(msgResult)
                                })
                    }).catch(function(e) {
                    console.log(e)
                })
        })
    },

    destroyContract: function() {
        var self = this
        Conference.deployed().then(function(instance) {
            conference = instance
            conference.destroy({
                    from: accounts[0]
                }).then(
                    function() {
                        $('#destroyContractResult').html('contract destroyed. pls refresh page to reflect balance')
                    }) // end of conference destroy
        }).catch(function(e) {
            console.log(e)
        })
    },

    getVal: function(rating) {
        var self = this
        var count = 0
        Conference.deployed().then(function(instance) {
            conference = instance
            conference.ratings.call(rating)
                .then(
                    function(cnt) {
                        console.log(count = cnt.toNumber())
                    }) // end of conference destroy
        }).catch(function(e) {
            console.log(e)
        })
    }

}

window.addEventListener('load', function() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
        console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
            // Use Mist/MetaMask's provider
        window.web3 = new Web3(web3.currentProvider)
    } else {
        console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask")
            // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))

        var $rateYo = $("#rateYo").rateYo({ "rating": 0.0, "fullStar": true })

        /* set the option `onChange` */
        $rateYo.rateYo("option", "onChange", function() {

            /* get the rated fill at the current point of time */
            var ratedFill = $rateYo.rateYo("option", "ratedFill")

            // console.log("The color of rating is " + ratedFill);
        });

        /* set the option `multiColor` to show Multi Color Rating */
        $rateYo.rateYo("option", "multiColor", true)

    }

    Conference.setProvider(web3.currentProvider)
    App.start()

    // Wire up the UI elements
    $('#changeQuota').click(function() {
        var val = $('#confQuota').val()
        App.changeQuota(val)
    })
    $('#changeLocation').click(function() {
        var val = $('#selectLocation').find(':selected').text()
        App.changeLocation(val)
    })

    $('#buyTicket').click(function() {
        var val = $('#ticketPrice').val()
        var buyerAddress = $('#buyerAddress').val()
        App.buyTicket(buyerAddress, web3.toWei(val))
    })
    $('#buyTickets').click(function() {
        var val = $('#ticketPrice').val()
        var ticketcount = $('#ticketsCount').val()
        var buyerAddress = $('#mbuyerAddress').val()
        App.buyMultipleTickets(buyerAddress, web3.toWei(val), ticketcount)
    })
    $('#refundTicket').click(function() {
        var val = $('#ticketPrice').val()
        var buyerAddress = $('#refBuyerAddress').val()
        App.refundTicket(buyerAddress, web3.toWei(val))
    })
    $('#setRating').click(function() {
        var val = $('#rating').text()
        var buyerAddress = $('#ratingAddress').val()
            // $.drawRatingGraph() // here for testing

        if (buyerAddress.length != 42)
            $('#ratingResult').html('Please enter a valid address')
        else
            App.setRating(buyerAddress, val)
    })
    $('#destroyContract').click(function() {
        App.destroyContract()
    })

    //RateYo! config
    // Setter
    $("#rateYo").rateYo("option", "onChange", function(rating, rateYoInstance) {

        // console.log(rating);
        $('#rating').html(rating);
    }); //returns a jQuery Element
    // Setter
    $("#rateYo").rateYo("option", "onSet", function() {

        $('#setRating').removeAttr('disabled');
    }); //returns a jQuery Element

    // function to draw a graph of all ratings
    $.drawRatingGraph = function() {
        $('#chartdiv').show();

        var arrayVals = []

        for (var i = 0; i < 6; i++) {
            arrayVals.push(App.getVal(i))
        }

        //TODO: replace dummy graph with working logic for ratings graph
        $.jqplot('chartdiv', [
            [
                [0, arrayVals[0]],
                [1, arrayVals[1]],
                [2, arrayVals[2]],
                [3, arrayVals[3]],
                [4, arrayVals[4]],
                [5, arrayVals[5]]
            ]
        ])
    }
})