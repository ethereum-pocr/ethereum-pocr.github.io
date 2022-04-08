let web3 = new Web3(Web3.givenProvider);

let governanceAddress  = "0x0000000000000000000000000000000000000100";

let contractInstance;
let myAddress;



$(document).ready(function() {
    $("#connect_button").click(connectAndDisplay);
    $("#self_button").click(selfRegister);
    $("#pledge_button").click(pledge);
    $("#save_button").click(setFootprint);
});


async function connectAndDisplay(){
   window.ethereum.enable().then(async function(accounts){
        contractInstance = new web3.eth.Contract(window.abi, governanceAddress);
        console.log("Address displayed");
        myAddress = contractInstance.currentProvider.selectedAddress;
        $("#Wallet_user_output").text("Wallet address : " + myAddress);
        console.log("currently checking if you are already registered ...");

          //checkIfRegistered();

  });
};

/*
async function checkIfRegistered() {
  await contractInstance.methods.auditorRegistered(myAddress).call({from: myAddress})
  .on('confirmation', function(confirmationNumber, receipt){
      console.log(isIt);
  });
}
*/


async function setFootprint(){

    let node = $("#node_input").val();
    console.log("node :" + node);

    let footprint = $("#footprint_input").val();
    console.log("footprint :" + footprint);

    let result = web3.utils.isAddress(node)
    console.log("Node address is " + result)  // => true

    node = web3.utils.toChecksumAddress(node);

    console.log(node)  // => true

    await contractInstance.methods.setFootprint(node,footprint).send({from: myAddress})
    .on('receipt', function(confirmationNumber, receipt){
      console.log("Footprint " + footprint + " for node " + node + " set !");
    });
};


async function selfRegister(){

  
  await contractInstance.methods.selfRegisterAuditor().send({from: myAddress})
  .on('receipt', function(confirmationNumber, receipt){
    console.log("You are registered !");
  });
};


async function pledge(){
  const value = "100000000"
  const amountToSend = web3.utils.toWei(value, "gwei"); // Convert to wei value
  await contractInstance.methods.pledge().send({from: myAddress,value:amountToSend})
  .on('receipt', function(confirmationNumber, receipt){
    console.log("Pledged !!");
  });
};
