import React from 'react';

import { storiesOf } from '@storybook/react';
import { withInfo } from "@storybook/addon-info";
import { action } from '@storybook/addon-actions';

import License, {LicenseComponent} from '../app/js/components/License';

const info = {inline: true, propTables: [LicenseComponent], propTablesExclude: [License]};

storiesOf('License', module)
  .add(
    "Display License",
    withInfo(info)(() => (
      <License buyLicense={action("buy-license")}/>
    ))
  ).add(
    "Display License when already own one",
    withInfo(info)(() => (
      <License isLicenseOwner/>
    ))
  );
