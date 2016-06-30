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

//<input type="button" data-bind="value: DisplayedAction, click: function (data, event) { manageProduct(data.ProductId); }" value="Manage">


function getAllProducts(){
	var allProducts = [];

	// get this page
	var p = getProductsForPage();
	for(i in p){
		allProducts.push(p[i]);
	}

	var num = getNumPages();

	for(var i=1; i <= num; i++){
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
		values['stock'] = striptags(row[5]);
		values['link'] = striptags(row[6]);
		if(!id == ""){
			products.push(values);
		}
	});
	return products;
}



// get the total number of pages
function getNextPage(){
	var nextLink;
	$('.pager a').each(function(){
		if($(this).html() == "Next"){
			// not disabled
			nextLink = $(this);
		};
	});


	if(!nextLink.hasClass('ui-state-disabled')){
		nextLink.click();
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
	for(var i=0; i < 2; i++){
		$.ajax({
			url:'https://store.tcgplayer.com/admin/product/manage/'+allProducts[i]['id']+'?OnlyMyInventory=true'		
		}).done(function(data){
			var table = $(data).find('.display.sTable')
			console.log(table);



		});
	}
}


// console.log(products);


