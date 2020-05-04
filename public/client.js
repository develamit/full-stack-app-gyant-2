
$(document).ready(function(){
  $("#btn-login").click(function(){
    let userId = $("#login-username").val();
    let passwd = $("#login-password").val();
    console.log('button was clicked: userId: ', userId, 'passwd: ', passwd);

    $.post("/api/login",
    {
      userId: userId,
      passwd: passwd
    },
    function(data, status){
      console.log("Status: ", status);
      console.log("cases: ", data.cases);
      console.log("conditions: ", data.conditions);
      if (status) {
        $(".container").hide();
        $("#case-cond").show();

      }
    });
  });
});
