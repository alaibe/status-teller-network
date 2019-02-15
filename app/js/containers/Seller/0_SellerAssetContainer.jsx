import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {connect} from "react-redux";

import balances from "../../features/balances";
import newSeller from "../../features/newSeller";
import SellerAssets from '../../components/Seller/SellerAssets';

class SellerAssetContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedAsset: props.seller.asset
    };
    this.validate(props.seller.asset);
    this.props.footer.onPageChange(() => {
      this.props.setAsset(this.state.selectedAsset);
    });
  }

  validate(asset) {
    if (asset) {
      this.props.footer.enableNext();
    } else {
      this.props.footer.disableNext();
    }
  }

  selectAsset = (selectedAsset) => {
    this.setState({selectedAsset});
    this.validate(selectedAsset);
  };

  render() {
    return (<SellerAssets selectAsset={this.selectAsset} selectedAsset={this.state.selectedAsset} availableAssets={this.props.tokens}/>);
  }
}

SellerAssetContainer.propTypes = {
  footer: PropTypes.object,
  setAsset: PropTypes.func,
  seller: PropTypes.object,
  tokens: PropTypes.array
};

const mapStateToProps = state => ({
  seller: newSeller.selectors.getNewSeller(state),
  tokens: balances.selectors.getTokensWithPositiveBalance(state)
});

export default connect(
  mapStateToProps,
  {
    setAsset: newSeller.actions.setAsset
  }
)(SellerAssetContainer);
