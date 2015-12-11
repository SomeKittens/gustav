'use strict';

import {gustav} from '../index';
import {expect} from 'chai';
import {addCommonNodes} from './testNodes';

addCommonNodes(gustav);

describe('registration errors', () => {
  it('should throw an error when we forget a name', () => {
    let thrower = () => gustav.source('', () => {});

    expect(thrower).to.throw('Attempted to register a node without providing a name');
  });

  it('should throw an error when we forget a factory', () => {
    let thrower = () => gustav.source('hello', null);

    expect(thrower).to.throw('Attempted to register node hello without providing a factory');
  });

  it('should throw an error when we try to re-register a node', () => {
    let thrower = () => gustav.source('timesTwo', () => {});

    expect(thrower).to.throw('timesTwo already registered');
  });
});
