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
    setStatus("Getting card conditions, this may take up to " + allProducts.length / 60 + " minutes");
  }, 2E3 * num + .5);
  setTimeout(function() {
    getConditions(allProducts);
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
  setStatus("DONE!");
  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  var linkText = document.createTextNode("Download Inventory");
  link.appendChild(linkText);
  link.setAttribute("download", getFileName());
  document.body.appendChild(link);
  link.click();
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
  var barHtml = '<div id="exportWrap"><p style="text-align: center;">Exporting Inventory, please wait.</p><div id="progress"><div class="bar"></div></div><p style="text-align: center;" id="status"></p><p style="text-align: center;"></div>';
  $("body > *:first-child").before(barHtml);
  $("#exportWrap").css("padding", "1em");
  $("#exportWrap").css("margin", "1em");
  $("#exportWrap").css("background-color", "#ccc");

  $("#progress").css('background-color','#fff');
  $("#progress").css('padding','.5em');
  $("#progress .bar").css('width','0%');
  $("#progress .bar").css('background-color','blue');
  $("#progress .bar").css('height','1em');


}
function setStatus(str) {
  $("#status").html(str);
}

function updateProgress(){
	console.log('Progress:' + completed/allProducts.lengt);
	$('#progress .bar').css('width',completed/allProducts.length+"%");	
}
