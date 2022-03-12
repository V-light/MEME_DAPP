import React, { Component , useState } from "react";
import Web3 from 'web3';
import "./App.css";
import Meme from '../abis/Meme.json'
// import { create } from "ipfs-http-client";
// const ipfs = create({
//   host: "ipfs.infura.io",
//   port: "5001",
//   protocol: "https",
// });

const ipfsAPI = require("ipfs-api");
const ipfs = ipfsAPI("ipfs.infura.io", "5001", { protocol: "https" });

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }
  constructor(props) {
    super(props);
    this.state = {
      buffer: null,
      memeHash : '',
      account: '',
      contract: null
    };
  }

  async loadWeb3(){
    if(window.ethereum){
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();


    }else if (window.web3){
      window.web3 = new Web3(window.web3.currentProvider);

    }else{
      console.log("Please install Metamask");
    }
  }

  async loadBlockchainData(){
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.setState({
      account: accounts[0]
    })
    const networkId = await web3.eth.net.getId();
    const networkData = Meme.networks[networkId];
    if(networkData){
      const abi = Meme.abi;
      const address = networkData.address;
      const contract = web3.eth.Contract(abi, address);
      this.setState({ contract});
      const memeHash = await contract.methods.get().call();
      this.setState({ memeHash});
    }else{
      window.alert('Contract is not deployed on this network Id');
    }

  }

  captureFile = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      console.log("buffer", Buffer(reader.result));
      this.setState({ buffer: Buffer(reader.result) });
    };
  };

  onSubmit = (e) => {
    e.preventDefault();
    console.log("submitting file....");
    ipfs.files.add(this.state.buffer, (err, result) => {
      console.log("IPFS RESULT : ", result);
      // this.setState({
      //   memeHash : result[0].hash
      // })]
      const memeHash = result[0].hash;
      if (err) {
        console.error(err);
        return;
      }
      this.state.contract.methods.set(memeHash).send({from: this.state.account}).then((r)=>{
        this.setState({memeHash});
      })
    });
  };

  render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="#"
            
            rel="noopener noreferrer"
          >
            Meme Of The Day
          </a>
          <ul className ='navbar-nav px-3'>
            <li className = 'nav-item'>
              <small className = 'text-white'> {this.state.account}</small>

            </li>
          </ul>
        </nav>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <a
                  
                >
                  <img src={`https://ipfs.infura.io/ipfs/${this.state.memeHash}`}  style = {{height: '30%'}}  />
                </a>
                <p>&nbsp;</p>
                <h1>Change Meme </h1>
                <form onSubmit={this.onSubmit}>
                  <input type="file" onChange={this.captureFile} />
                  <input type="submit" />
                </form>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
