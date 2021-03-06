import {
  CREATE_ESCROW, RESET_CREATE_ESCROW_STATUS, LOAD_ESCROWS, RELEASE_ESCROW, CANCEL_ESCROW,
  RATE_TRANSACTION, PAY_ESCROW, OPEN_CASE, OPEN_CASE_SIGNATURE, PAY_ESCROW_SIGNATURE, CLOSE_DIALOG,
  ADD_USER_RATING, USER_RATING
} from './constants';
import Escrow from 'Embark/contracts/Escrow';
import { addDecimals } from '../../utils/numbers';

export const createEscrow = (buyerAddress, username, tradeAmount, statusContactCode, offer) => {
  tradeAmount = addDecimals(tradeAmount, offer.token.decimals);
  return {
    type: CREATE_ESCROW,
    toSend: Escrow.methods.create(buyerAddress, offer.id, tradeAmount, 1, statusContactCode, '', username)
  };
};

export const resetCreateEscrowStatus = () => ({
  type: RESET_CREATE_ESCROW_STATUS
});

export const loadEscrows = (offerId) => ({ type: LOAD_ESCROWS, offerId });

// TODO: Update with new UI

export const releaseEscrow = (escrowId) => ({ type: RELEASE_ESCROW, escrowId, toSend: Escrow.methods.release(escrowId) });

export const payEscrow = (escrowId) => ({ type: PAY_ESCROW, escrowId, toSend: Escrow.methods.pay(escrowId) });

export const payEscrowSignature = (escrowId) => ({ type: PAY_ESCROW_SIGNATURE, escrowId });

export const openCase = (escrowId) => ({ type: OPEN_CASE, escrowId, toSend: Escrow.methods.openCase(escrowId)});

export const openCaseSignature = (escrowId) => ({ type: OPEN_CASE_SIGNATURE, escrowId });

export const cancelEscrow = (escrowId) => ({ type: CANCEL_ESCROW, escrowId, toSend: Escrow.methods.cancel(escrowId) });

export const rateTransaction = (escrowId, rating) => ({ type: RATE_TRANSACTION, escrowId, rating, toSend: Escrow.methods.rateTransaction(escrowId, rating) });

export const closeDialog = () => ({ type: CLOSE_DIALOG });

export const checkUserRating = (address) => ({ type: USER_RATING, address });

export const addUserRating = () => ({ type: ADD_USER_RATING });
