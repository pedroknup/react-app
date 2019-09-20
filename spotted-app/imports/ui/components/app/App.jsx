import React, { Component } from "react";
import { withTracker } from "meteor/react-meteor-data";
import ReactDOM from "react-dom";
import Spotted from "../spotted/spotted.component.jsx";
import NewSpotted from "../new-spotted/new-spotted.component.jsx";
import SpottedDetails from "../spotted-details/spotted-details.component.jsx";

import "./app.css";

import FooterIos from "../footer-ios/footer-ios.component.jsx";
import Navbar from "../navbar/navbar.component.jsx";
import { bindActionCreators } from "redux";

import * as actions from "../../redux/actions/index";
import { connect } from "react-redux";
import { NEW_SPOTTED, PAGE_SPOTTED } from "../../redux/constants/pages.js";
import Spotteds from "../../../api/spotteds.js";
import elasticScroll from "elastic-scroll-polyfill";
import TabAndroid from "../tab-android/tab-android.component.jsx";
import {
  checkBridge,
  getSystemInfo,
  getDeviceId,
  initBridge,
  getUniqueId,
  getGeolocation,
  uploadPicture
} from "../../util/react-native-bridge.js";
import { NativeNavbar } from "../native-navbar/native-navbar.jsx";
import { RedView, BlueView } from "./components.js";
import { devices } from "../../redux/constants/enums.js";
import { getRandomName } from "../../util/random-names.js";
import {
  calculateDistanceBetweenTwoCoords,
  simplifyDistance
} from "../../util/geolocalization.js";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 0,
      pageSize: 10,
      isNewIOS: true,
      isLoading: true,
      os: "ios",
      pages: [],
      modalPage: null
    };
    this.push = this.push.bind(this);
    this.previousPage = this.previousPage.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);

    const self = this;
    try {
      initBridge();
      getGeolocation(
        response => {
          // {
          //   coords={
          //     altitude,
          //     altitudeAccuracy,
          //     latitude,
          //     accuracy,
          //     longitude,
          //   },
          //   timestamp
          // }

          // alert(JSON.stringify(response))
          this.props.actions.changeCoordinates(response);
        },
        () => {
          alert("err");
        }
      );
      getDeviceId(
        OS => {
          self.props.actions.changeDevice(OS);
        },
        () => {
          const device = devices.WEB;
          this.setState({ isLoading: false });
          self.props.actions.changeDevice(device);
        }
      );
    } catch (e) {
    }

    function getUniqueId() {
      if (typeof ReactNativeBridge !== 'undefined') {
        ReactNativeBridge.call('getUniqueId', function (err, res) {
          if (err) {
            self.setState({ isLoading: false });
            // self.props.actions.setUniqueId("web");
            alert(" oops");
          } else {
            self.props.actions.changeUniqueId(res);

            self.setState({ isLoading: false });
          }
        });
      } else {
        setTimeout(getUniqueId, 100);
      }
    }

    getUniqueId();
  }

  push(component, title, hasActionButton) {
    const pages = this.state.pages;
    const pageToAdd = { component: component, title: title, hasActionButton };
    pages.push(pageToAdd);
    this.setState({
      pages
    });
  }
  openModal(modal) {
    this.setState({
      modal
    });
  }
  closeModal() {
    this.setState({
      modal: null
    });
  }

  previousPage() {

    let pages = this.state.pages;
    if (pages.length) {
      setTimeout(() => {
        const popped = pages.pop();

        this.setState({ pages });
      }, 50);
    }
  }

  renderSpotteds(spotteds) {
    const isNewIOS = true;

    // return this.props.tasks.map(task => <Task key={task._id} task={task} />);
    return (
      <div data-elastic className="content">
        <h1>VISH</h1>
        {spotteds.map((spotted, id) => (
          <Spotted
            key={id}
            text={spotted.text}
            source={spotted.source}
            color={spotted.color}
            id={spotted.id}
            comments={spotted.comments}
            likes={spotted.likes}
            isLiked={spotted.isLiked}
          />
        ))}
      </div>
    );
  }

  componentDidMount() {
    elasticScroll();
  }
  renderSpotted() {
    return <SpottedDetails />;
  }
  renderNewSpotted() {
    return <NewSpotted />;
  }
  handleSubmit(event) {
    event.preventDefault();
  }


  render() {
    const { currentLocation, history } = this.props;
    const { page, pageSize, os, isNewIOS, uploadedImage } = this.state;
    const self = this;

    return (
      <div
        style={{
          paddingTop: this.props.device === devices.IOS_NOTCH ? "45px" : "0"
        }}
        className="app"
      >
        {() => {
          this.props.actions.verify();
          return;
        }}

        {!this.state.isLoading && (
          <NativeNavbar
            previousPage={this.previousPage}
            push={this.push}
            device={this.props.device}
            pages={this.state.pages}
            spotteds={this.props.spotteds}
            secondPage={this.state.secondPage}
            openModal={this.openModal}
            closeModal={this.closeModal}
            modalPage={this.state.modal}
            ref={"nativeSwipeableRoutes"}
          ></NativeNavbar>
        )}
      </div>
    );
  }
}

// export default connect(
//   withTracker(props => {
//     const handle = Meteor.subscribe("spotteds");

//     return {
//       isLoading: !handle.ready(),
//       spotteds: Spotteds.find({}, { sort: { createdAt: -1 } }).fetch()
//     };
//   })
// )(App);

function mapStateToProps(state) {
  return { device: state.device, uniqueId: state.uniqueId };
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(actions, dispatch) };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App);

// export default withTracker((props) => {
//   const subscriptionHandle = Meteor.subscribe("spotteds");

//   return {
//     isLoading: !subscriptionHandle.ready(),
//     spotteds: Spotteds.find().fetch()
//     // spotteds: Spotteds.find({}, { sort: { createdAt: -1 } }).fetch()
//   };
// })(App);
