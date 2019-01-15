import { configure } from '@storybook/react';

const req = require.context("../stories", true, /.stories.jsx$/);

function loadStories() {
  req.keys().forEach(filename => req(filename));
}

configure(loadStories, module);

import 'bootstrap/dist/css/bootstrap.css';
import '../app/js/i18n';