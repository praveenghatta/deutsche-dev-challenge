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

var stompData = []; //holds the latest set of data always..
var rowsHolder = {};
var midPriceData = {};
var refreshInterval;

const url = "ws://localhost:8011/stomp"
const client = Stomp.client(url)
client.debug = function(msg) {
  if (global.DEBUG) {
    console.info(msg);
  }
}

function connectCallback() {
    var destination = '/fx/prices';
    var sub = client.subscribe(destination, function(message) {
        if(message.body != null){
            updateStompData(JSON.parse(message.body));
        }
    });
}

client.connect({}, connectCallback, function(error) {
  alert(error.headers.message)
});

function updateStompData(data) {

    if(refreshInterval == undefined){
        refreshInterval = setInterval(function(){
            //console.log('SparkData Refresh For - ', data.name);
            midPriceData = []; //reset it to empty ...
            clearInterval(refreshInterval);

            //explicitly setting as undefined, as we dont want the interval to be cleared on every new incoming data
            //this way post 30 seconds, the interval will be created again specifically.
            refreshInterval = undefined;
        }, 30000);
    }

    //generate the mid price data before capturing it in Latest data object ...
    if(!midPriceData.hasOwnProperty(data.name))
        midPriceData[data.name] = [];
    midPriceData[data.name].push((data.bestBid + data.bestAsk)/2);
    data['midPrice'] = midPriceData[data.name];

    //capture the new data in the latest data object.
    stompData[data.name] = data;

    var table = document.querySelector('#dataTable');
    var row = document.querySelector("#" + data.name);

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
    for (var i = document.getElementById("dataTable").rows.length; i > 1; i--)
        document.getElementById("dataTable").deleteRow(i - 1);

    //sort all the rowsHolder array ...
    var sortedData = sortRowsHolder(rowsHolder);

    //append all the nodes present in rowsHolder...
    for(var row in sortedData)
        table.appendChild(sortedData[row]);
}

function fetchCellData(data, key){
    var cell = document.createElement("td");

    if(key == 'midPrice'){
        var span = document.createElement("span");
        Sparkline.draw(span, data);
        cell.appendChild(span);
    }else{
        var cellText = document.createTextNode(data);
        cell.appendChild(cellText);
    }

    return cell;
}

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