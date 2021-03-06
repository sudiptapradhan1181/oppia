// Copyright 2015 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for ReadOnlyCollectionBackendApiService.
 */

require('domain/collection/read-only-collection-backend-api.service.ts');
// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Read only collection backend API service', function() {
  var ReadOnlyCollectionBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(
    'oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.upgradedServices)) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    ReadOnlyCollectionBackendApiService = $injector.get(
      'ReadOnlyCollectionBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');

    // Sample collection object returnable from the backend
    sampleDataResults = {
      collection: {
        id: '0',
        title: 'Collection Under Test',
        category: 'Test',
        objective: 'To pass',
        schema_version: '1',
        nodes: [{
          exploration_id: '0'
        }],
        next_exploration_ids: [],
        completed_exploration_ids: []
      }
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing collection from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/collection_handler/data/0').respond(
        sampleDataResults);
      ReadOnlyCollectionBackendApiService.fetchCollection('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should load a cached collection after fetching it from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a collection the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/collection_handler/data/0').respond(
        sampleDataResults);
      ReadOnlyCollectionBackendApiService.loadCollection('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
      expect(failHandler).not.toHaveBeenCalled();

      // Loading a collection the second time should not fetch it.
      ReadOnlyCollectionBackendApiService.loadCollection('0').then(
        successHandler, failHandler);

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a collection the first time should fetch it from the backend.
      $httpBackend.expect('GET', '/collection_handler/data/0').respond(
        500, 'Error loading collection 0.');
      ReadOnlyCollectionBackendApiService.loadCollection('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading collection 0.');
    }
  );

  it('should report caching and support clearing the cache', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The collection should not currently be cached.
    expect(ReadOnlyCollectionBackendApiService.isCached('0')).toBeFalsy();

    // Loading a collection the first time should fetch it from the backend.
    $httpBackend.expect('GET', '/collection_handler/data/0').respond(
      sampleDataResults);
    ReadOnlyCollectionBackendApiService.loadCollection('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
    expect(failHandler).not.toHaveBeenCalled();

    // The collection should now be cached.
    expect(ReadOnlyCollectionBackendApiService.isCached('0')).toBeTruthy();

    // The collection should be loadable from the cache.
    ReadOnlyCollectionBackendApiService.loadCollection('0').then(
      successHandler, failHandler);
    expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
    expect(failHandler).not.toHaveBeenCalled();

    // Resetting the cache will cause another fetch from the backend.
    ReadOnlyCollectionBackendApiService.clearCollectionCache();
    expect(ReadOnlyCollectionBackendApiService.isCached('0')).toBeFalsy();

    $httpBackend.expect('GET', '/collection_handler/data/0').respond(
      sampleDataResults);
    ReadOnlyCollectionBackendApiService.loadCollection('0').then(
      successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResults.collection);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should report a cached collection after caching it', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // The collection should not currently be cached.
    expect(ReadOnlyCollectionBackendApiService.isCached('0')).toBeFalsy();

    // Cache a collection.
    ReadOnlyCollectionBackendApiService.cacheCollection('0', {
      id: '0',
      nodes: []
    });

    // It should now be cached.
    expect(ReadOnlyCollectionBackendApiService.isCached('0')).toBeTruthy();

    // A new collection should not have been fetched from the backend. Also,
    // the returned collection should match the expected collection object.
    ReadOnlyCollectionBackendApiService.loadCollection('0').then(
      successHandler, failHandler);

    // http://brianmcd.com/2014/03/27/
    // a-tip-for-angular-unit-tests-with-promises.html
    $rootScope.$digest();

    expect(successHandler).toHaveBeenCalledWith({
      id: '0',
      nodes: []
    });
    expect(failHandler).not.toHaveBeenCalled();
  });
});
