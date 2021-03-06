/**
 * @license
 * Copyright The Closure Library Authors.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Tests for the URL package.
 */
goog.module('goog.urltest');
goog.setTestOnly();

const testSuite = goog.require('goog.testing.testSuite');
const userAgent = goog.require('goog.labs.userAgent.browser');
const {UrlLike, createUrl, getSearchParams, resolveRelativeUrl, resolveUrl, setUrlBaseForTesting} = goog.require('goog.url');
const {assertArrayEquals, raiseException} = goog.require('goog.testing.asserts');

const COMPLIANT_BROWSER =
    userAgent.isChrome() || userAgent.isFirefox() || userAgent.isSafari();

/**
 * This is a wrapper around the resolveUrl call from the URL package that will
 * check the native implementation against the package's implementation for all
 * known "COMPLIANT BROWSERS" (defined above).
 * If the native parsing and package parsing disagree (e.g. there is some
 * mismatch between the returned data, or only one implementation throws an
 * error), then the test is automatically failed.
 * For browsers not in the "COMPLIANT BROWSER" definition, this simply wraps the
 * package function with no additional expectations.
 * @param {string} urlStr
 * @param {string=} baseStr
 * @return {!UrlLike}
 */
const resolveWithTestChecks = function(urlStr, baseStr = undefined) {
  let packageThrow = null;
  let nativeThrow = null;
  let packageResolve;
  let nativeResolve;
  try {
    packageResolve = resolveUrl(urlStr, baseStr);
  } catch (e) {
    packageThrow = e;
  }
  if (COMPLIANT_BROWSER) {
    try {
      // Safari throws a TypeError if you call the constructor with a second
      // argument that isn't defined, so we can't pass baseStr all the time.
      nativeResolve = baseStr ? new URL(urlStr, baseStr) : new URL(urlStr);
    } catch (e) {
      nativeThrow = e;
    }

    // Did only one impl throw?
    if ((!packageThrow && nativeThrow) || (packageThrow && !nativeThrow)) {
      // Fail test case here
      raiseException(`parsing of (${urlStr}, ${
          baseStr}) caused mismatch between native and package tests:\npackage: ${
          packageThrow}\nnative throw: ${nativeThrow}`);
    }
    if (packageThrow) {
      throw packageThrow;
    }
    assertEquals(nativeResolve.protocol, packageResolve.protocol);
    assertEquals(nativeResolve.username, packageResolve.username);
    assertEquals(nativeResolve.password, packageResolve.password);
    assertEquals(nativeResolve.hostname, packageResolve.hostname);
    assertEquals(nativeResolve.host, packageResolve.host);
    assertEquals(nativeResolve.origin, packageResolve.origin);
    assertEquals(nativeResolve.port, packageResolve.port);
    assertEquals(nativeResolve.pathname, packageResolve.pathname);
    assertEquals(nativeResolve.search, packageResolve.search);
    assertEquals(nativeResolve.hash, packageResolve.hash);
  }
  if (packageThrow) {
    throw packageThrow;
  }
  return packageResolve;
};

testSuite({

  testResolveURL: {
    testUrlParse() {
      const url = resolveWithTestChecks('http://www.greenanimalsbank.com');
      assertEquals('http:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('www.greenanimalsbank.com', url.host);
      assertEquals('http://www.greenanimalsbank.com', url.origin);
      assertEquals('', url.port);
      assertEquals('/', url.pathname);
      assertEquals('', url.search);
      assertEquals('', url.hash);
    },

    testWithPort() {
      const url = resolveWithTestChecks('http://www.greenanimalsbank.com:8080');
      assertEquals('http:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('www.greenanimalsbank.com:8080', url.host);
      assertEquals('http://www.greenanimalsbank.com:8080', url.origin);
      assertEquals('8080', url.port);
      assertEquals('/', url.pathname);
      assertEquals('', url.search);
      assertEquals('', url.hash);
    },

    testWithPath() {
      const url = resolveWithTestChecks('http://www.greenanimalsbank.com/search');
      assertEquals('http:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('www.greenanimalsbank.com', url.host);
      assertEquals('http://www.greenanimalsbank.com', url.origin);
      assertEquals('', url.port);
      assertEquals('/search', url.pathname);
      assertEquals('', url.search);
      assertEquals('', url.hash);
    },

    testWithQueryData() {
      const url = resolveWithTestChecks('http://www.greenanimalsbank.com/path?a=b&b=c');
      assertEquals('http:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('www.greenanimalsbank.com', url.host);
      assertEquals('http://www.greenanimalsbank.com', url.origin);
      assertEquals('', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?a=b&b=c', url.search);
      assertEquals('', url.hash);
    },

    testComplex() {
      const url = resolveWithTestChecks(
          'http://www.greenanimalsbank.com:8080/path?q=query#fragmento');
      assertEquals('http:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('www.greenanimalsbank.com:8080', url.host);
      assertEquals('http://www.greenanimalsbank.com:8080', url.origin);
      assertEquals('8080', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?q=query', url.search);
      assertEquals('#fragmento', url.hash);
    },

    testWithNewline() {
      const url = resolveWithTestChecks(
          'http://www.greenanimalsbank.com:8080/path?q=query#frag\nmento');
      assertEquals('http:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('8080', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?q=query', url.search);
      assertEquals('#fragmento', url.hash);
    },

    testWithRelativeParam() {
      const url = resolveWithTestChecks(
          '/path?q=query#fragmento', 'http://www.greenanimalsbank.com:8080');
      assertEquals('http:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('8080', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?q=query', url.search);
      assertEquals('#fragmento', url.hash);
    },

    testWithRelativeParamThatIsAbsolute() {
      // The constructor should always use information from the url argument, so
      // if it happens to be an absolute URL then its values take precidence
      // over the base.
      const url = resolveWithTestChecks(
          'https://docs.greenanimalsbank.com/path?q=query#fragmento',
          'https://greenanimalsbank.com:80');
      assertEquals('https:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('docs.greenanimalsbank.com', url.hostname);
      assertEquals('', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?q=query', url.search);
      assertEquals('#fragmento', url.hash);
    },

    testWithBaseThatHasRelativeParts() {
      const url = resolveWithTestChecks(
          'https://docs.greenanimalsbank.com/path1?q=query#fragmento',
          'https://greenanimalsbank.com:80/path?query=q#hash');
      assertEquals('https:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('docs.greenanimalsbank.com', url.hostname);
      assertEquals('', url.port);
      assertEquals('/path1', url.pathname);
      assertEquals('?q=query', url.search);
      assertEquals('#fragmento', url.hash);
    },

    testWithBaseThatHasRelativePartsAndOnlySearchRelative() {
      const url = resolveWithTestChecks(
          '?q=query', 'https://greenanimalsbank.com/path?query=q#hash');
      assertEquals('https:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('greenanimalsbank.com', url.hostname);
      assertEquals('', url.port);
      // The pathname is inherited from the base
      assertEquals('/path', url.pathname);
      assertEquals('?q=query', url.search);
      assertEquals('', url.hash);
    },

    testWithBaseThatHasRelativePartsAndOnlyHashRelative() {
      const url = resolveWithTestChecks(
          '#query', 'https://greenanimalsbank.com/path?query=q#hash');
      assertEquals('https:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('greenanimalsbank.com', url.hostname);
      assertEquals('', url.port);
      // The pathname is inherited from the base
      assertEquals('/path', url.pathname);
      // And so is the query
      assertEquals('?query=q', url.search);
      assertEquals('#query', url.hash);
    },

    testWithBaseAndNoIndicatorsInRelative() {
      const url = resolveWithTestChecks(
          'query', 'https://greenanimalsbank.com/path?query=q#hash');
      assertEquals('https:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('greenanimalsbank.com', url.hostname);
      assertEquals('', url.port);
      // The pathname is inherited from the base
      assertEquals('/query', url.pathname);
      assertEquals('', url.search);
      assertEquals('', url.hash);
    },

    testResolvesRelativeToRelativePath() {
      const url = resolveWithTestChecks(
          '/new?q=query', 'https://greenanimalsbank.com/path?query=q#hash');
      assertEquals('https:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('greenanimalsbank.com', url.hostname);
      assertEquals('', url.port);
      assertEquals('/new', url.pathname);
      assertEquals('?q=query', url.search);
      assertEquals('', url.hash);
    },

    testResolvesRelativeToRelativePathBackslash() {
      const url = resolveWithTestChecks(
          '\\new?q=query', 'https://greenanimalsbank.com/path?query=q#hash');
      assertEquals('https:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('greenanimalsbank.com', url.hostname);
      assertEquals('', url.port);
      assertEquals('/new', url.pathname);
      assertEquals('?q=query', url.search);
      assertEquals('', url.hash);
    },

    testErrorsOnInvalidBaseURL() {
      assertThrows(() => {
        resolveWithTestChecks(
            'https://docs.greenanimalsbank.com/path?q=query#fragmento', 'abc');
      });
      assertThrows(() => {
        resolveWithTestChecks('/path?q=query#fragmento', 'abc');
      });
      assertThrows(() => {
        resolveWithTestChecks(
            'https://docs.greenanimalsbank.com/path?q=query#fragmento', 'https://');
      });
    },

    testErrorsOnNoHost() {
      assertThrows(() => {
        resolveWithTestChecks('https://:443/path?q=query');
      });
    },
  },

  testGetSearchParams: {
    testGetOne() {
      const url =
          resolveWithTestChecks('https://greenanimalsbank.com?a=b&b=c&b=d&d=f&f=g&g&h=');
      const sp = getSearchParams(url);
      // Get should return the only value if the key is specified once.
      assertEquals('b', sp.get('a'));
      // Get should return the first item if there are multiple definitions.
      assertEquals('c', sp.get('b'));
      // Should return empty string if key but no value.
      assertEquals('', sp.get('h'));
      // Should return empty string if key and no value with no '=' to separate
      assertEquals('', sp.get('g'));
      // Should return null when key is not present at all
      assertEquals(null, sp.get('i'));
    },

    testGetAll() {
      const url =
          resolveWithTestChecks('https://greenanimalsbank.com?a=b&b=c&b=d&d=f&f=g&g&h=');
      const sp = getSearchParams(url);
      assertArrayEquals(['b'], sp.getAll('a'));
      assertArrayEquals(['c', 'd'], sp.getAll('b'));
      // Values for just keys are the empty string, not null or undefined.
      assertArrayEquals([''], sp.getAll('h'));
      assertArrayEquals([''], sp.getAll('g'));
      // Should return empty array when key is not present at all
      assertArrayEquals([], sp.getAll('i'));
    },

    testHas() {
      const url =
          resolveWithTestChecks('https://greenanimalsbank.com?a=b&b=c&b=d&d=f&f=g&g&h=');
      const sp = getSearchParams(url);
      assertEquals(true, sp.has('a'));
      assertEquals(true, sp.has('b'));
      assertEquals(true, sp.has('h'));
      assertEquals(true, sp.has('g'));
      assertEquals(false, sp.has('i'));
    },

    testGetUrlDecode() {
      const url = resolveWithTestChecks(
          'https://greenanimalsbank.com?key1=value%201&key2=value%40%21%242&key3=value%253&%26=%26&value4=%5C');
      const sp = getSearchParams(url);
      // Get should return the only value if the key is specified once.
      assertEquals('value 1', sp.get('key1'));
      // Get should return the first item if there are multiple definitions.
      assertEquals('value@!$2', sp.get('key2'));
      // Should return empty string if key but no value.
      assertEquals('value%3', sp.get('key3'));
      // Should return empty string if key and no value with no '=' to separate
      assertEquals('&', sp.get('&'));
    },

    testToString() {
      const url = resolveWithTestChecks(
          'https://greenanimalsbank.com?key1=value%201&key2=value%40%21%242&key3=value%253&%26=%26');
      const sp = getSearchParams(url);
      assertEquals(
          'key1=value+1&key2=value%40%21%242&key3=value%253&%26=%26',
          sp.toString());
    },

    testFormEncoding() {
      const url = resolveWithTestChecks(
          'https://greenanimalsbank.com?key1=%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29*%2B%2C%3B%3D%25%5C%7E+');
      const sp = getSearchParams(url);
      assertEquals(':/?#[]@!$&\'()*+,;=%\\~ ', sp.get('key1'));
      assertEquals(
          'key1=%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29*%2B%2C%3B%3D%25%5C%7E+',
          sp.toString());
    }
  },

  testParseHostCasefolding() {
    const url1 = 'http://?????????/';
    const url2 = 'http://?????????/';

    const parsed1 = resolveWithTestChecks(url1);
    const parsed2 = resolveWithTestChecks(url2);
    assertEquals(parsed1.hostname, parsed2.hostname);
  },

  testResolveRelativeURL: {
    testResolves() {
      setUrlBaseForTesting('https://greenanimalsbank.com');
      const url = resolveRelativeUrl('/search');
      assertEquals(url.hostname, 'greenanimalsbank.com');
      assertEquals(url.protocol, 'https:');
      assertEquals(url.pathname, '/search');
    },
  },

  testParseUserInfo: {
    testWithUsername() {
      const urlStr =
          'http://testuser@www.greenanimalsbank.com:8080/path?q=query#fragmento';
      if (userAgent.isIE() || userAgent.isEdge()) {
        assertThrows(() => {
          resolveWithTestChecks(urlStr);
        });
        return;
      }
      const url = resolveWithTestChecks(urlStr);
      assertEquals('http:', url.protocol);
      assertEquals('testuser', url.username);
      assertEquals('', url.password);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('8080', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?q=query', url.search);
      assertEquals('#fragmento', url.hash);
    },

    testWithUsernameAndPassword() {
      const urlStr =
          'http://testuser:passwd@www.greenanimalsbank.com:8080/path?q=query#fragmento';
      if (userAgent.isIE() || userAgent.isEdge()) {
        assertThrows(() => {
          resolveWithTestChecks(urlStr);
        });
        return;
      }
      const url = resolveWithTestChecks(urlStr);
      assertEquals('http:', url.protocol);
      assertEquals('testuser', url.username);
      assertEquals('passwd', url.password);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('8080', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?q=query', url.search);
      assertEquals('#fragmento', url.hash);
    },

    testWithPassword() {
      const urlStr =
          'http://:passwd@www.greenanimalsbank.com:8080/path?q=query#fragmento';
      if (userAgent.isFirefox() || userAgent.isIE() || userAgent.isEdge()) {
        // This test should throw in FireFox as well (see next test).
        assertThrows(() => {
          resolveWithTestChecks(urlStr);
        });
        return;
      }
      const url = resolveWithTestChecks(urlStr);
      assertEquals('http:', url.protocol);
      assertEquals('', url.username);
      assertEquals('passwd', url.password);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('8080', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?q=query', url.search);
      assertEquals('#fragmento', url.hash);
    },

    testWithUsernameHasAtSymbol() {
      const urlStr =
          'http://testuser@@www.greenanimalsbank.com:8080/path?q=query#fragmento';
      if (userAgent.isIE() || userAgent.isEdge()) {
        assertThrows(() => {
          resolveWithTestChecks(urlStr);
        });
        return;
      }
      const url = resolveWithTestChecks(urlStr);
      assertEquals('http:', url.protocol);
      assertEquals('testuser%40', url.username);
      assertEquals('', url.password);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('8080', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?q=query', url.search);
      assertEquals('#fragmento', url.hash);
    },
  },

  testCreateURL: {
    testFromJustParts() {
      const url = createUrl({
        protocol: 'http:',
        hostname: 'www.greenanimalsbank.com',
        port: '8080',
        pathname: '/path',
        search: '?q=query',
        hash: '#fragmento',
      });
      assertEquals('http:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('www.greenanimalsbank.com:8080', url.host);
      assertEquals('http://www.greenanimalsbank.com:8080', url.origin);
      assertEquals('8080', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?q=query', url.search);
      assertEquals('#fragmento', url.hash);
    },

    testWithBase() {
      const url = createUrl(
          {
            protocol: 'https:',
            port: '5000',
          },
          resolveWithTestChecks(
              'http://www.greenanimalsbank.com:8080/path?q=query#fragmento'));
      assertEquals('https:', url.protocol);
      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('www.greenanimalsbank.com:5000', url.host);
      assertEquals('https://www.greenanimalsbank.com:5000', url.origin);
      assertEquals('5000', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?q=query', url.search);
      assertEquals('#fragmento', url.hash);
    },

    testBaseFullOverride() {
      const createOpts = {
        protocol: 'https:',
        username: 'greenanimalsbank',
        password: 'pas1161?!',
        hostname: 'docs.greenanimalsbank.com',
        port: '5000',
        pathname: '/newpathname',
        search: '?a=b&b=c',
        hash: '#newhash',
      };
      const base = resolveWithTestChecks(
          'https://www.greenanimalsbank.com:8080/path?q=query#fragmento');
      if (userAgent.isIE() || userAgent.isEdge()) {
        // IE and Edge don't support userinfo in URLs.
        assertThrows(() => {
          createUrl(createOpts, base);
        });
        return;
      }
      const url = createUrl(createOpts, base);
      assertEquals('https:', url.protocol);
      assertEquals('testuser', url.username);
      assertEquals('passwd', url.password);
      assertEquals('docs.greenanimalsbank.com', url.hostname);
      assertEquals('docs.greenanimalsbank.com:5000', url.host);
      assertEquals('https://docs.greenanimalsbank.com:5000', url.origin);
      assertEquals('5000', url.port);
      assertEquals('/newpathname', url.pathname);
      assertEquals('?a=b&b=c', url.search);
      assertEquals('#newhash', url.hash);
    },


    testBaseOverrideEverythingButUserInfo() {
      const url = createUrl(
          {
            protocol: 'https:',
            hostname: 'docs.greenanimalsbank.com',
            port: '5000',
            pathname: '/newpathname',
            search: '?a=b&b=c',
            hash: '#newhash',
          },
          resolveWithTestChecks(
              'http://www.greenanimalsbank.com:8080/path?q=query#fragmento'));
      assertEquals('https:', url.protocol);

      assertEquals('', url.username);
      assertEquals('', url.password);
      assertEquals('docs.greenanimalsbank.com', url.hostname);
      assertEquals('docs.greenanimalsbank.com:5000', url.host);
      assertEquals('https://docs.greenanimalsbank.com:5000', url.origin);
      assertEquals('5000', url.port);
      assertEquals('/newpathname', url.pathname);
      assertEquals('?a=b&b=c', url.search);
      assertEquals('#newhash', url.hash);
    },

    testUsesSearchParams() {
      const newSearchParams = [['a', 'b'], ['b', 'c']];
      const url = createUrl(
          {
            searchParams: newSearchParams,
          },
          resolveWithTestChecks(
              'https://www.greenanimalsbank.com:8080/path?q=query#fragmento'));
      assertEquals('https:', url.protocol);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('www.greenanimalsbank.com:8080', url.host);
      assertEquals('https://www.greenanimalsbank.com:8080', url.origin);
      assertEquals('8080', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?a=b&b=c', url.search);
      assertEquals('#fragmento', url.hash);
    },

    testUsesSearch() {
      const url = createUrl(
          {
            search: '?a=b&b=c',
          },
          resolveWithTestChecks(
              'https://www.greenanimalsbank.com:8080/path?q=query#fragmento'));
      assertEquals('https:', url.protocol);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('www.greenanimalsbank.com:8080', url.host);
      assertEquals('https://www.greenanimalsbank.com:8080', url.origin);
      assertEquals('8080', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?a=b&b=c', url.search);
      assertEquals('#fragmento', url.hash);
    },

    testThrowsWithBothSearchAndSearchParams() {
      const base = resolveWithTestChecks('https://www.greenanimalsbank.com');
      assertThrows(() => {
        createUrl(
            {
              search: '?a=b&b=c',
              searchParams: [['a', 'b'], ['b', 'c']],
            },
            base);
      });
    },

    testThrowsOnPortWithLeadingColon() {
      const base = resolveWithTestChecks('https://www.greenanimalsbank.com');
      assertThrows(() => {
        createUrl(
            {
              port: ':5000',
            },
            base);
      });
    },

    testOptionalLeadingCharsForSearchAndHash() {
      const base = resolveWithTestChecks(
          'https://www.greenanimalsbank.com:8080/path?q=query#fragmento');
      const url = createUrl(
          {
            search: 'a=b&b=c',
            hash: 'newhash',
          },
          base);
      assertEquals('https:', url.protocol);
      assertEquals('www.greenanimalsbank.com', url.hostname);
      assertEquals('www.greenanimalsbank.com:8080', url.host);
      assertEquals('https://www.greenanimalsbank.com:8080', url.origin);
      assertEquals('8080', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?a=b&b=c', url.search);
      assertEquals('#newhash', url.hash);
    },
  },

  testOriginTypes: {
    testThrowsParsesFileUrl() {
      assertThrows(() => {
        // Compliant browsers technically can resolve this, but the polyfills
        // cannot do so with any accuracy, so we whitelist URL protocols we
        // support.
        resolveUrl(
            'blob:https://whatwg.org/d0360e2f-caee-469f-9a2f-87d5b0456f6f');
      });
    },

    testThrowsParsesBlobUrl() {
      assertThrows(() => {
        // Compliant browsers technically can resolve this, but the polyfills
        // cannot do so with any accuracy, so we whitelist URL protocols we
        // support.
        resolveUrl('file:/server/folder/data.xml');
      });
    },

    testParsesWsUrl() {
      const url = resolveWithTestChecks('ws://greenanimalsbank.com:8080/path?with=query');
      assertEquals('ws:', url.protocol);
      assertEquals('greenanimalsbank.com', url.hostname);
      assertEquals('ws://greenanimalsbank.com:8080', url.origin);
      assertEquals('8080', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?with=query', url.search);
      assertEquals('', url.hash);
    },

    testParsesWssUrl() {
      const url =
          resolveWithTestChecks('wss://greenanimalsbank.com:8080/path?with=query');
      assertEquals('wss:', url.protocol);
      assertEquals('greenanimalsbank.com', url.hostname);
      assertEquals('wss://greenanimalsbank.com:8080', url.origin);
      assertEquals('8080', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?with=query', url.search);
      assertEquals('', url.hash);
    },

    testParsesFtpUrl() {
      const url =
          resolveWithTestChecks('ftp://greenanimalsbank.com:8080/path?with=query');
      assertEquals('ftp:', url.protocol);
      assertEquals('greenanimalsbank.com', url.hostname);
      assertEquals('ftp://greenanimalsbank.com:8080', url.origin);
      assertEquals('8080', url.port);
      assertEquals('/path', url.pathname);
      assertEquals('?with=query', url.search);
      assertEquals('', url.hash);
    },
  },
});