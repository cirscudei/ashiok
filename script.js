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


function striptags(OriginalString = ""){
	var StrippedString = OriginalString.replace(/(<([^>]+)>)/ig,"");
	var ret = StrippedString.replace(/[^-0-9a-zA-Z']/ig,"")
	return ret;
}

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
	
	products.push(values);
});

console.log(products);


