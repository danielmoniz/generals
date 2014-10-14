
$(document).ready(function() {

  $("input#surrender").click(function() {
    var surrender = confirm("Are you sure you want to surrender?");
    if (surrender) {
      socket.emit("surrender");
      console.log("Surrendering...");
    }
  });

});
