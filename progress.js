
var barHtml = '<div id="exportWrap"><p style="text-align: center;">Exporting Inventory, please wait.</p><div id="bar"><div class="progress"></div></div></div>';

$('body > *:first-child').before(barHtml);

$('#exportWrap').css('padding','1em');
$('#exportWrap').css('margin','1em');
$('#exportWrap').css('background-color','#ccc');

$('#bar').css('padding','.25em');
$('#bar').css('background-color','#fff');

$('#bar .progress').css('width','0px');
$('#bar .progress').css('height','1em');
$('#bar .progress').css('background-color','blue');
