/* 
 * TCG Inventory Export Bookmarklet
 *
 * Notes:
 *  - Currently only does the first page
 *  - Grabs all cards, stock, rarity, id
 *	- Does not yet do condition or foil, 
 *      will need to add qjqx to get that
 *      to work.
**/


var allProducts = [];
addInterface();
var completed = 0;
var currentPage = 1;
getAllProducts(); // start it


function getAllProducts() {


	// get this page
	var p;
	p = getProductsForPage();
	for (var i in p){
		allProducts.push(p[i]);
	}

	var num = getNumPages();

	for (var i=1; i <= num; i++){
    		setTimeout(function(){
			getNextPage();
			var p = getProductsForPage();
			for(i in p){
				allProducts.push(p[i]);
			}
			console.log(allProducts);
		},2000*i);
	};
	setTimeout(function(){
		setStatus("Getting card conditions, this may take up to " + (allProducts.length/60) + " minutes");
	},2000*num+.5);
	setTimeout(function(){
		getConditions(allProducts);
	},2000*num+1);
	



}

function getProductsForPage() {
	var products = [];
	$('#ProductsTable tr').each(function(){
		var row = [];
		var id = "";
		$(this).find('td').each(function(){
			row.push($(this).html());
			if($(this).attr('id')){
		
				id = $(this).attr('id');
				id = id.replace(/^.*_/,"");
			}
		});
		var values = [];
		values['type'] = striptags(row[0]);
		values['name'] = striptags(row[1]);
		values['id'] = id;
		values['set'] = striptags(row[2]); /// caontains id, needed for call
		values['rarity'] = striptags(row[3]);
		values['number'] = striptags(row[4]);
		//values['stock'] = striptags(row[5]);
		values['link'] = striptags(row[6]);
		if(!id == ""){
			products[values['id']] = values;
		}
	});
	return products;
}



// get the total number of pages
function getNextPage(){
	setStatus('Getting Page ' + currentPage + " ("+ allProducts.length + " total products)");
	var nextLink;
	$('.pager a').each(function(){
		if($(this).html() == "Next"){
			// not disabled
			nextLink = $(this);
		};
	});


	if(!nextLink.hasClass('ui-state-disabled')){	
		nextLink.click();
		currentPage++;
		return true;
	} else {
		return false;
	}
}

function getNumPages() {
	return $('.pager a:not(.ui-state-disabled)').length - 1;
}

function striptags(OriginalString = ""){
	var StrippedString = OriginalString.replace(/(<([^>]+)>)/ig,"");
	var ret = StrippedString.replace(/[^-0-9a-zA-Z']/ig,"")
	return ret;
}

function getConditions(allProducts){
	// https://store.tcgplayer.com/admin/product/manage/39065?OnlyMyInventory=true
	console.log('getting conditions');

	// build the array of deferred calls


	var getArray = [];
	for(var i=0; i < allProducts.length; i++){ 
		getArray.push(getCondition(allProducts[i], i));

	}
	// wait until all the calls are done
	$.when.apply($, getArray).done(exportFile);
}

function getCondition(product, i) {
	// the async ajax call here
	$.ajax({
		url:'https://store.tcgplayer.com/admin/product/manage/'+product['id']+'?OnlyMyInventory=true'	,
		async:false,	
	}).success(function(data){

		var table = $(data).find('.display.sTable tbody')
		var stock = [];
		$(table).find('tr').each(function(){
			var thisRow = [];
			thisRow['condition'] = striptags($(this).find('td:first-child').html());
			thisRow['quantity'] = $(this).find('td:nth-child(5n) input').val();
			thisRow['price'] = $(this).find('td:nth-child(6n) input').val()
			if(thisRow['quantity'] > 0){
				stock[product['id'] + "_" + thisRow['condition']] = thisRow;
			}
	
		});
		allProducts[i]['stock'] = stock;

	});
}

function exportFile(){
	// export the excell file (CSV), for import into urza
	console.log('exporting');
	//console.log(allProducts);

	var list = [];
	// turn it into the right format
	for(var i = 0; i < allProducts.length; i++){
		// one line for each stock row		
		for(s in allProducts[i]['stock']){
			console.log('pushing stock');
			//console.log(allProducts[i]['stock'][s]);
			var thisRet = [
				allProducts[i]['id'],
				allProducts[i]['name'],
				allProducts[i]['set'],
				allProducts[i]['stock'][s]['condition'],
				allProducts[i]['stock'][s]['price'],
				allProducts[i]['stock'][s]['quantity']
			];
			list.push(thisRet);
			console.log(thisRet);
		}

	
	}
	//console.log(list);
	var csvContent = "data:text/csv;charset=utf-8,";
	list.forEach(function(infoArray, index){

	   dataString = infoArray.join(",");
	   csvContent += index < list.length ? dataString+ "\n" : dataString;

	}); 

	// download itsetStatus
	setStatus("DONE!");
	var encodedUri = encodeURI(csvContent);
	var link = document.createElement("a");
	link.setAttribute("href", encodedUri);
	var linkText = document.createTextNode("Download Inventory");
	a.appendChild(linkText);
	link.setAttribute("download", getFileName());
	document.body.appendChild(link); // Required for FF



	link.click(); // This will download the data file named "my_data.csv".	var encodedUri = encodeURI(csvContent);
}

function getFileName(){
	var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!

    var yyyy = today.getFullYear();
    if(dd<10){
	dd='0'+dd
    } 
    if(mm<10){
	mm='0'+mm
    } 
    var today = dd+'_'+mm+'_'+yyyy+'_tcg_inventory.csv';
	return today;
}

function addInterface(){

	var barHtml = '<div id="exportWrap"><p style="text-align: center;">Exporting Inventory, please wait.</p><p style="text-align: center;" id="status"></p><p style="text-align: center;"></div>';

	$('body > *:first-child').before(barHtml);

	$('#exportWrap').css('padding','1em');	
	$('#exportWrap').css('margin','1em');
	$('#exportWrap').css('background-color','#ccc');
}

function setStatus(str){
	$('#status').html(str);
}
