// const html2canvas = require('html2canvas');
//
// $(document).ready(function()  {
//
// })
//
// function screenshot() {
//   console.log("trying to take screenshot...");
//   var elem = document.getElementById("capture");
//   html2canvas( elem ).then(canvas => {
//     var base64Image = canvas.toDataURL("image/png");
//     window.open(base64Image, target="_blank");
// });
// }

$(document).ready(function() {
  console.log('page loaded');
  // document.getElementById("overlay").style.display = "none";
})

$(function() {

  // contact form animations
  $('#contact').click(function() {
    document.getElementById("overlay").style.display = "block";
    $('#contactForm').fadeToggle();
  })
  $(document).mouseup(function (e) {
    var container = $("#contactForm");

    if (!container.is(e.target) // if the target of the click isn't the container...
        && container.has(e.target).length === 0) // ... nor a descendant of the container
    {
      document.getElementById("overlay").style.display = "none";
      container.fadeOut();
    }
  });

});
