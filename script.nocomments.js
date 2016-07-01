var allProducts = [];
addInterface();
var completed = 0;
var currentPage = 1;
getAllProducts();


function getAllProducts() {
  var p;
  p = getProductsForPage();
  for (var i in p) {
    allProducts.push(p[i]);
  }
  var num = getNumPages();
  for (var i = 1;i <= num;i++) {
    setTimeout(function() {
      getNextPage();
      var p = getProductsForPage();
      for (i in p) {
        allProducts.push(p[i]);
      }
      console.log(allProducts);
    }, 2E3 * i);
  }
  setTimeout(function() {
    setStatus("Getting card conditions (" + allProducts.length + "), this may take up to " + allProducts.length / 60 + " minutes");
  }, 2E3 * num + .5);
  setTimeout(function() {
    var promise = getConditions(allProducts);
    $.when(promise).done(function(){
      exportFile();
    });
  }, 2E3 * num + 1);
}
function getProductsForPage() {
  var products = [];
  $("#ProductsTable tr").each(function() {
    var row = [];
    var id = "";
    $(this).find("td").each(function() {
      row.push($(this).html());
      if ($(this).attr("id")) {
        id = $(this).attr("id");
        id = id.replace(/^.*_/, "");
      }
    });
    var values = [];
    values["type"] = striptags(row[0]);
    values["name"] = striptags(row[1]);
    values["id"] = id;
    values["set"] = striptags(row[2]);
    values["rarity"] = striptags(row[3]);
    values["number"] = striptags(row[4]);
    values["link"] = striptags(row[6]);
    if (!id == "") {
      products[values["id"]] = values;
    }
  });
  return products;
}
function getNextPage() {
  setStatus("Getting Page " + currentPage + " (" + allProducts.length + " total products)");
  var nextLink;
  $(".pager a").each(function() {
    if ($(this).html() == "Next") {
      nextLink = $(this);
    }
  });
  if (!nextLink.hasClass("ui-state-disabled")) {
    nextLink.click();
    currentPage++;
    return true;
  } else {
    return false;
  }
}
function getNumPages() {
  return $(".pager a:not(.ui-state-disabled)").length - 1;
}
function striptags(OriginalString) {
  OriginalString = OriginalString === undefined ? "" : OriginalString;
  var StrippedString = OriginalString.replace(/(<([^>]+)>)/ig, "");
  var ret = StrippedString.replace(/[^-0-9a-zA-Z']/ig, "");
  return ret;
}
function getConditions(allProducts) {
  console.log("getting conditions");
  var def = $.Deferred();
  var getArray = [];
  for (var i = 0;i < allProducts.length ;i++) {
    getArray.push(getCondition(allProducts[i], i));
  }
  $.when.apply($, getArray).then(function() { def.resolve(); });
  return def.promise();
}
function getCondition(product, i) {
  var def = $.Deferred();
  var promise = $.ajax({url:"https://store.tcgplayer.com/admin/product/manage/" + product["id"] + "?OnlyMyInventory=true", async:true}).success(function(data) {
    completed++;
    updateProgress();
    var table = $(data).find(".display.sTable tbody");
    var stock = [];
    $(table).find("tr").each(function() {
      var thisRow = [];
      thisRow["condition"] = striptags($(this).find("td:first-child").html());
      thisRow["quantity"] = $(this).find("td:nth-child(5n) input").val();
      thisRow["price"] = $(this).find("td:nth-child(6n) input").val();
      if (thisRow["quantity"] > 0) {
        stock[product["id"] + "_" + thisRow["condition"]] = thisRow;
      }
    });
    allProducts[i]["stock"] = stock;
  });
  $.when(promise).done(function() {
    def.resolve();
  });
  return def.promise();
}
function exportFile() {
  console.log("exporting");
  var list = [];
  for (var i = 0;i < allProducts.length;i++) {
    for (s in allProducts[i]["stock"]) {
      console.log("pushing stock");
      var thisRet = [allProducts[i]["id"], allProducts[i]["name"], allProducts[i]["set"], allProducts[i]["stock"][s]["condition"], allProducts[i]["stock"][s]["price"], allProducts[i]["stock"][s]["quantity"]];
      list.push(thisRet);
      console.log(thisRet);
    }
  }
  var csvContent = "data:text/csv;charset=utf-8,";
  list.forEach(function(infoArray, index) {
    dataString = infoArray.join(",");
    csvContent += index < list.length ? dataString + "\n" : dataString;
  });
  setStatus("");
  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
    link.setAttribute("id", "downloadLink");
  var linkText = document.createTextNode("Download Inventory");
  link.appendChild(linkText);
  link.setAttribute("download", getFileName());
  $('#exportWrap #status').append(link);
  $('#downloadLink').css({
    padding: '2px 10px 8px 10px',
    height: '15px',
    display: 'inline-block',
    border: '1px solid #447fac',
    'border-radius': '3px',
    cursor: 'pointer',
    background: '#72b8e4 url(../Content/images/backgrounds/titleBgBlue.jpg) repeat-x',
    color: '#fff',
    margin: '1em auto'
    
  });
}
function getFileName() {
  var today = new Date;
  var dd = today.getDate();
  var mm = today.getMonth() + 1;
  var yyyy = today.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  var today = dd + "_" + mm + "_" + yyyy + "_tcg_inventory.csv";
  return today;
}
function addInterface() {
  var barHtml = '<div id="exportWrap"><p style="text-align: center; margin-bottom:1em;">Exporting Inventory, please wait: <b>DO NOTHING!</b></p><div id="progress"><div class="bar"><div class="caption" style="text-align: center; position: absolute; left: 0px; right: 0px; text-shadow: 1px 1px #fff;line-height: 2em; top: 0px;"></div></div></div><p style="text-align: center;" id="status"></p><div style="float: right; color: #666;padding-top: 1em;">Compliments of <a href="http://urza.com?ref=tcg_extractor">Urza.com</a></div></div>';
  $("body > *:first-child").before(barHtml);
  $("#exportWrap").css("padding", "1em");
  $("#exportWrap").css("margin", "1em");
  $("#exportWrap").css("background-color", "#ccc");
  $("#exportWrap").css("text-align", "center");

  $("#progress").css('background-color','#fff');
  $("#progress").css('position','relative');
  $("#progress").css('padding','.5em');
  $("#progress .bar").css('width','0%');
  $("#progress .bar").css('background-color','#72b8e4');
  $("#progress .bar").css('height','1em');


}
function setStatus(str) {
  $("#status").html(str);
}

function updateProgress(){
	console.log('Progress:' + completed/allProducts.length*100 + '%');
	$('#progress .caption').html(completed + "/" + allProducts.length);
	$('#progress .bar').css('width',completed/allProducts.length*100+"%");	
}
