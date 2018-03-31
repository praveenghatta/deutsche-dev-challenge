/**
 * This javascript file will constitute the entry point of your solution.
 *
 * Edit it as you need.  It currently contains things that you might find helpful to get started.
 */

// This is not really required, but means that changes to index.html will cause a reload.
require('./site/index.html')
// Apply the styles in style.css to the page.
require('./site/style.css')

// if you want to use es6, you can do something like
//     require('./es6/myEs6code')
// here to load the myEs6code.js file, and it will be automatically transpiled.

// Change this to get detailed logging from the stomp library
global.DEBUG = false;

var rowsHolder = {};   //holds the existing rows of the table always.
var midPriceData = {}; //holds the last 30 secs data
var refreshInterval;   //holds the timers clearInterval variable

const url = "ws://localhost:8011/stomp";
const prices_url = '/fx/prices';
const interval_time = 30000;

const client = Stomp.client(url);

client.debug = function(msg) {
  if (global.DEBUG) {
    console.info(msg);
  }
}

client.connect(
    {},
    function(){
        client.subscribe(prices_url, function(message) {
            if(message.body != null)
                updateStompData(JSON.parse(message.body));
        });
    },
    function(error) {
        console.log(error.headers.message);
    }
);

function updateStompData(data) {

    if(refreshInterval == undefined)
        applyTimer();

    //generate the mid price data before capturing it in Latest data object ...
    if(!midPriceData.hasOwnProperty(data.name))
        midPriceData[data.name] = [];
    midPriceData[data.name].push((data.bestBid + data.bestAsk)/2);
    data['midPrice'] = midPriceData[data.name];

    var table = document.querySelector('#dataTable');

    if(table != undefined){
        var tr = document.createElement("tr");
        tr.setAttribute("id", data["name"]);
        tr.setAttribute("data-lastChangeBid", data["lastChangeBid"]); //used for sorting data later ...

        for (var key in data) {
            var cell = fetchCellData(data[key], key);
            tr.appendChild(cell);
        }

        //always update the existing object with the new data...
        rowsHolder[data.name] = tr;

        //delete all rows except first header row..
        for (var i = table.rows.length; i > 1; i--)
            table.deleteRow(i - 1);

        //sort all the rowsHolder array before adding it to DOM...
        var sortedData = sortRowsHolder(rowsHolder);

        //append all the nodes present in rowsHolder...
        for(var row in sortedData)
            table.appendChild(sortedData[row]);
    }
}

function applyTimer() {
    refreshInterval = setInterval(function () {
        midPriceData = []; //reset it to empty ...
        clearInterval(refreshInterval); //clear the interval

        //explicitly setting as undefined, as we dont want the interval to be cleared on every new incoming data
        //this way post 30 seconds, the interval will be created again specifically.
        refreshInterval = undefined;
    }, interval_time);
}

function fetchCellData(data, key){
    var cell = document.createElement("td");

    if(key == 'midPrice'){
        var span = document.createElement("span");
        Sparkline.draw(span, data);
        cell.appendChild(span);
    }
    else if(key == 'name'){
        var cellText = document.createTextNode(data.toUpperCase());
        cell.appendChild(cellText);
    }
    else{
        var cellText = document.createTextNode(data);
        cell.appendChild(cellText);
    }

    return cell;
}

//function to sort the objects based on a property value..
function compare(a,b) {
    if (a.getAttribute('data-lastChangeBid') < b.getAttribute('data-lastChangeBid'))
        return 1;
    if (a.getAttribute('data-lastChangeBid') > b.getAttribute('data-lastChangeBid'))
        return -1;
    return 0;
}

function sortRowsHolder(rowsObj){
    var arr = new Array();

    for( var k in rowsObj)
        arr.push(rowsObj[k]);

    arr.sort(compare);
    return arr;
}
