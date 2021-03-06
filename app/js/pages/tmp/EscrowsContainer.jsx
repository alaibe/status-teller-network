import React, {Component, Fragment} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import EscrowList from "../../components/tmp/EscrowList";
import CreateEscrowForm from '../../components/tmp/CreateEscrowForm';
import License from '../../components/tmp/License';
import license from '../../features/license';
import escrow from '../../features/escrow';

class EscrowsContainer extends Component {
  componentDidMount() {
    this.props.checkLicenseOwner();
    this.props.checkUserRating();
    this.props.getEscrows();
  }

  buyLicense = () => {
    this.props.buyLicense();
  };

  createEscrow = (buyer, value, expiration) => {
    this.props.createEscrow(buyer, value, expiration);
  };

  render() {
    const {error, userRating, isLicenseOwner, isCreateLoading, escrowError, escrowReceipt, escrows, releaseEscrow,
      openCase, payEscrow, signature, payEscrowSignature, openCaseSignature, closeDialog, cancelEscrow,
      errorGet, loadingList, rateTransaction, createdTxHash, txHashList, licenseLoading, licenseTxHash} = this.props;

    return <Fragment>
      <License buyLicense={this.buyLicense} isLicenseOwner={isLicenseOwner} userRating={userRating} error={error}
               loading={licenseLoading} txHash={licenseTxHash}/>

      {isLicenseOwner &&
      <CreateEscrowForm create={this.createEscrow} result={escrowReceipt} error={escrowError}
                        isLoading={isCreateLoading} txHash={createdTxHash}/>}

      <EscrowList escrows={escrows} releaseEscrow={releaseEscrow}
                  openCase={openCase} payEscrow={payEscrow}
                  signature={signature}
                  payEscrowSignature={payEscrowSignature}
                  openCaseSignature={openCaseSignature}
                  closeDialog={closeDialog}
                  cancelEscrow={cancelEscrow} error={errorGet} loading={loadingList}
                  rateTransaction={rateTransaction} txHash={txHashList}/>
    </Fragment>;
  }
}

EscrowsContainer.propTypes = {
  checkLicenseOwner: PropTypes.func,
  licenseLoading: PropTypes.bool,
  checkUserRating: PropTypes.func,
  buyLicense: PropTypes.func,
  licenseTxHash: PropTypes.string,
  createEscrow: PropTypes.func,
  releaseEscrow: PropTypes.func,
  payEscrow: PropTypes.func,
  payEscrowSignature: PropTypes.func,
  openCase: PropTypes.func,
  openCaseSignature: PropTypes.func,
  closeDialog: PropTypes.func,
  cancelEscrow: PropTypes.func,
  rateTransaction: PropTypes.func,
  getEscrows: PropTypes.func,
  escrows: PropTypes.array,
  isCreateLoading: PropTypes.bool,
  createdTxHash: PropTypes.string,
  txHashList: PropTypes.string,
  signature: PropTypes.object,
  loadingList: PropTypes.bool,
  errorGet: PropTypes.string,
  error: PropTypes.string,
  userRating: PropTypes.number,
  isLicenseOwner: PropTypes.bool,
  escrowError: PropTypes.string,
  escrowReceipt: PropTypes.object
};

const mapStateToProps = state => ({
  isLicenseOwner: license.selectors.isLicenseOwner(state),
  licenseLoading: license.selectors.isLoading(state),
  userRating: license.selectors.userRating(state),
  error: license.selectors.error(state),
  licenseTxHash: license.selectors.txHash(state),
  escrowError: escrow.selectors.error(state),
  isCreateLoading: escrow.selectors.isLoading(state),
  escrowReceipt: escrow.selectors.receipt(state),
  errorGet: escrow.selectors.errorGet(state),
  loadingList: escrow.selectors.loadingList(state),
  createdTxHash: escrow.selectors.txHash(state),
  txHashList: escrow.selectors.txHashList(state),
  escrows: escrow.selectors.escrows(state),
  signature: escrow.selectors.signature(state)
});

export default connect(
  mapStateToProps,
  {
    buyLicense: license.actions.buyLicense,
    createEscrow: escrow.actions.createEscrow,
    getEscrows: escrow.actions.getEscrows,
    payEscrow: escrow.actions.payEscrow,
    payEscrowSignature: escrow.actions.payEscrowSignature,
    openCase: escrow.actions.openCase,
    openCaseSignature: escrow.actions.openCaseSignature,
    releaseEscrow: escrow.actions.releaseEscrow,
    cancelEscrow: escrow.actions.cancelEscrow,
    rateTransaction: escrow.actions.rateTransaction,
    checkLicenseOwner: license.actions.checkLicenseOwner,
    checkUserRating: escrow.actions.checkUserRating,
    closeDialog: escrow.actions.closeDialog
  }
)(EscrowsContainer);
