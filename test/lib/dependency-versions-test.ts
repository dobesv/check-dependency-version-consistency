import {
  calculateVersionsForEachDependency,
  calculateMismatchingVersions,
  filterOutIgnoredDependencies,
  fixMismatchingVersions,
} from '../../lib/dependency-versions.js';
import { getPackages } from '../../lib/workspace.js';
import {
  FIXTURE_PATH_VALID,
  FIXTURE_PATH_INCONSISTENT_VERSIONS,
  FIXTURE_PATH_NO_PACKAGES,
  FIXTURE_PATH_NO_DEPENDENCIES,
  FIXTURE_PATH_PACKAGE_MISSING_PACKAGE_JSON,
  FIXTURE_PATH_INCONSISTENT_LOCAL_PACKAGE_VERSION,
} from '../fixtures/index.js';
import mockFs from 'mock-fs';
import { readFileSync } from 'node:fs';
import type { PackageJson } from 'type-fest';
import { join } from 'node:path';

function getPackagesHelper(root: string) {
  return getPackages(root, [], [], [], []);
}

describe('Utils | dependency-versions', function () {
  describe('#calculateMismatchingVersions', function () {
    it('has no mismatches with valid fixture', function () {
      const dependencyVersions = calculateVersionsForEachDependency(
        getPackagesHelper(FIXTURE_PATH_VALID)
      );
      expect(calculateMismatchingVersions(dependencyVersions)).toStrictEqual(
        []
      );
    });

    it('has mismatches with fixture with inconsistent versions', function () {
      const dependencyVersions = calculateVersionsForEachDependency(
        getPackagesHelper(FIXTURE_PATH_INCONSISTENT_VERSIONS)
      );
      expect(calculateMismatchingVersions(dependencyVersions)).toStrictEqual([
        {
          dependency: 'baz',
          versions: [
            {
              version: '^7.8.9',
              packages: [
                expect.objectContaining({
                  path: join(
                    FIXTURE_PATH_INCONSISTENT_VERSIONS,
                    '@scope1',
                    'package1'
                  ),
                }),
              ],
            },
            {
              version: '^8.0.0',
              packages: [
                expect.objectContaining({
                  path: join(
                    FIXTURE_PATH_INCONSISTENT_VERSIONS,
                    '@scope1',
                    'package2'
                  ),
                }),
              ],
            },
          ],
        },
        {
          dependency: 'foo',
          versions: [
            {
              version: '1.2.0',
              packages: [
                expect.objectContaining({
                  path: join(FIXTURE_PATH_INCONSISTENT_VERSIONS),
                }),
                expect.objectContaining({
                  path: join(
                    FIXTURE_PATH_INCONSISTENT_VERSIONS,
                    '@scope1',
                    'package2'
                  ),
                }),
                expect.objectContaining({
                  path: join(
                    FIXTURE_PATH_INCONSISTENT_VERSIONS,
                    '@scope1',
                    'package3'
                  ),
                }),
              ],
            },
            {
              version: '1.3.0',
              packages: [
                expect.objectContaining({
                  path: join(
                    FIXTURE_PATH_INCONSISTENT_VERSIONS,
                    '@scope1',
                    'package1'
                  ),
                }),
              ],
            },
          ],
        },
      ]);
    });

    it('has empty results when no packages', function () {
      const dependencyVersions = calculateVersionsForEachDependency(
        getPackagesHelper(FIXTURE_PATH_NO_PACKAGES)
      );
      expect(calculateMismatchingVersions(dependencyVersions)).toStrictEqual(
        []
      );
    });

    it('has empty results when no dependencies', function () {
      const dependencyVersions = calculateVersionsForEachDependency(
        getPackagesHelper(FIXTURE_PATH_NO_DEPENDENCIES)
      );
      expect(calculateMismatchingVersions(dependencyVersions)).toStrictEqual(
        []
      );
    });

    it('has empty results when a package is missing package.json', function () {
      const dependencyVersions = calculateVersionsForEachDependency(
        getPackagesHelper(FIXTURE_PATH_PACKAGE_MISSING_PACKAGE_JSON)
      );
      expect(calculateMismatchingVersions(dependencyVersions)).toStrictEqual(
        []
      );
    });

    it('has mismatches with inconsistent local package version', function () {
      const dependencyVersions = calculateVersionsForEachDependency(
        getPackagesHelper(FIXTURE_PATH_INCONSISTENT_LOCAL_PACKAGE_VERSION)
      );
      expect(calculateMismatchingVersions(dependencyVersions)).toStrictEqual([
        {
          dependency: 'package2',
          versions: [
            {
              version: '^0.0.0',
              packages: [
                expect.objectContaining({
                  path: join(
                    FIXTURE_PATH_INCONSISTENT_LOCAL_PACKAGE_VERSION,
                    'package1'
                  ),
                }),
              ],
            },
            {
              version: '1.0.0',
              packages: [
                expect.objectContaining({
                  path: join(
                    FIXTURE_PATH_INCONSISTENT_LOCAL_PACKAGE_VERSION,
                    'package2'
                  ),
                }),
              ],
            },
          ],
        },
      ]);
    });
  });

  describe('#filterOutIgnoredDependencies', function () {
    it('filters out an ignored dependency', function () {
      const dependencyVersions = calculateMismatchingVersions(
        calculateVersionsForEachDependency(
          getPackagesHelper(FIXTURE_PATH_INCONSISTENT_VERSIONS)
        )
      );
      expect(
        filterOutIgnoredDependencies(dependencyVersions, ['foo'], [])
      ).toStrictEqual([
        {
          dependency: 'baz',
          versions: [
            {
              version: '^7.8.9',
              packages: [
                expect.objectContaining({
                  path: join(
                    FIXTURE_PATH_INCONSISTENT_VERSIONS,
                    '@scope1',
                    'package1'
                  ),
                }),
              ],
            },
            {
              version: '^8.0.0',
              packages: [
                expect.objectContaining({
                  path: join(
                    FIXTURE_PATH_INCONSISTENT_VERSIONS,
                    '@scope1',
                    'package2'
                  ),
                }),
              ],
            },
          ],
        },
      ]);
    });

    it('filters out an ignored dependency with regexp', function () {
      const dependencyVersions = calculateMismatchingVersions(
        calculateVersionsForEachDependency(
          getPackagesHelper(FIXTURE_PATH_INCONSISTENT_VERSIONS)
        )
      );
      expect(
        filterOutIgnoredDependencies(
          dependencyVersions,
          [],
          [new RegExp('^f.+$')]
        )
      ).toStrictEqual([
        {
          dependency: 'baz',
          versions: [
            {
              version: '^7.8.9',
              packages: [
                expect.objectContaining({
                  path: join(
                    FIXTURE_PATH_INCONSISTENT_VERSIONS,
                    '@scope1',
                    'package1'
                  ),
                }),
              ],
            },
            {
              version: '^8.0.0',
              packages: [
                expect.objectContaining({
                  path: join(
                    FIXTURE_PATH_INCONSISTENT_VERSIONS,
                    '@scope1',
                    'package2'
                  ),
                }),
              ],
            },
          ],
        },
      ]);
    });

    it('filters out a local package inconsistency', function () {
      const dependencyVersions = calculateMismatchingVersions(
        calculateVersionsForEachDependency(
          getPackagesHelper(FIXTURE_PATH_INCONSISTENT_LOCAL_PACKAGE_VERSION)
        )
      );
      expect(
        filterOutIgnoredDependencies(dependencyVersions, ['package2'], [])
      ).toStrictEqual([]);
    });

    it('throws when unnecessarily ignoring a dependency that has no mismatches', function () {
      const dependencyVersions = calculateMismatchingVersions(
        calculateVersionsForEachDependency(
          getPackagesHelper(FIXTURE_PATH_INCONSISTENT_VERSIONS)
        )
      );
      expect(() =>
        filterOutIgnoredDependencies(dependencyVersions, ['nonexistentDep'], [])
      ).toThrowErrorMatchingInlineSnapshot(
        '"Specified option \'--ignore-dep nonexistentDep\', but no version mismatches detected for this dependency."'
      );
    });

    it('throws when unnecessarily regexp-ignoring a dependency that has no mismatches', function () {
      const dependencyVersions = calculateMismatchingVersions(
        calculateVersionsForEachDependency(
          getPackagesHelper(FIXTURE_PATH_INCONSISTENT_VERSIONS)
        )
      );
      expect(() =>
        filterOutIgnoredDependencies(
          dependencyVersions,
          [],
          [new RegExp('nonexistentDep')]
        )
      ).toThrowErrorMatchingInlineSnapshot(
        '"Specified option \'--ignore-dep-pattern /nonexistentDep/\', but no matching dependencies with version mismatches detected."'
      );
    });

    it('does not filter anything out when nothing to ignore', function () {
      const dependencyVersions = calculateMismatchingVersions(
        calculateVersionsForEachDependency(
          getPackagesHelper(FIXTURE_PATH_INCONSISTENT_VERSIONS)
        )
      );
      expect(
        filterOutIgnoredDependencies(dependencyVersions, [], []).length
      ).toStrictEqual(2);
    });
  });

  describe('#fixMismatchingVersions', function () {
    describe('inconsistent dependency versions', function () {
      beforeEach(function () {
        // Create a mock workspace filesystem for temporary usage in this test because changes will be written to some files.
        mockFs({
          'package.json': JSON.stringify({
            workspaces: ['@scope1/*'],
            devDependencies: { foo: '^1.0.0' },
          }),
          '@scope1/package1': {
            'package.json': JSON.stringify({
              name: '@scope1/package1',
              dependencies: { foo: '^1.0.0', bar: '^3.0.0', 'a.b.c': '5.0.0' },
              devDependencies: {
                'one.two.three': '^4.1.0',
                '@types/one': '1.0.1',
              },
            }),
          },
          '@scope1/package2': {
            'package.json': `${JSON.stringify({
              name: '@scope1/package2',
              dependencies: {
                foo: '^2.0.0',
                bar: 'invalidVersion',
                'a.b.c': '~5.5.0',
              },
              devDependencies: {
                'one.two.three': '^4.0.0',
                '@types/one': '1.0.0',
              },
            })}\n`, // Ends in newline.
          },
        });
      });

      afterEach(function () {
        mockFs.restore();
      });

      it('fixes the fixable inconsistencies', function () {
        const packages = getPackagesHelper('.');
        const mismatchingVersions = calculateMismatchingVersions(
          calculateVersionsForEachDependency(packages)
        );
        const { fixed, notFixed } = fixMismatchingVersions(
          packages,
          mismatchingVersions
        );

        // Read in package.json files.
        const packageJsonRootContents = readFileSync('package.json', 'utf8');
        const packageJson1Contents = readFileSync(
          '@scope1/package1/package.json',
          'utf8'
        );
        const packageJson2Contents = readFileSync(
          '@scope1/package2/package.json',
          'utf8'
        );
        const packageJsonRoot: PackageJson = JSON.parse(
          packageJsonRootContents
        );
        const packageJson1: PackageJson = JSON.parse(packageJson1Contents);
        const packageJson2: PackageJson = JSON.parse(packageJson2Contents);

        // foo
        // updates the package1 `foo` version to the latest version
        expect(
          packageJson1.dependencies && packageJson1.dependencies.foo
        ).toStrictEqual('^2.0.0');
        // does not change package2 `foo` version since already at latest version
        expect(
          packageJson2.dependencies && packageJson2.dependencies.foo
        ).toStrictEqual('^2.0.0');
        // updates the root package `foo` version to the latest version
        expect(
          packageJsonRoot.devDependencies && packageJsonRoot.devDependencies.foo
        ).toStrictEqual('^2.0.0');

        // bar
        // does not change package1 `bar` version due to abnormal version present
        expect(
          packageJson1.dependencies && packageJson1.dependencies.bar
        ).toStrictEqual('^3.0.0');
        // does not change package2 `bar` version due to abnormal version present
        expect(
          packageJson2.dependencies && packageJson2.dependencies.bar
        ).toStrictEqual('invalidVersion');

        // a.b.c
        // updates the package1 `a.b.c` version to the latest version
        expect(
          packageJson1.dependencies && packageJson1.dependencies['a.b.c']
        ).toStrictEqual('~5.5.0');
        // does not change package2 `a.b.c` version since already at latest version
        expect(
          packageJson2.dependencies && packageJson2.dependencies['a.b.c']
        ).toStrictEqual('~5.5.0');

        // one.two.three
        // does not change package1 `one.two.three` version since already at latest version
        expect(
          packageJson1.devDependencies &&
            packageJson1.devDependencies['one.two.three']
        ).toStrictEqual('^4.1.0');
        // updates the package2 `one.two.three` version to the latest version
        expect(
          packageJson2.devDependencies &&
            packageJson2.devDependencies['one.two.three']
        ).toStrictEqual('^4.1.0');

        // @types/one
        // does not change package1 `@types/one` version since already at latest version
        expect(
          packageJson1.devDependencies &&
            packageJson1.devDependencies['@types/one']
        ).toStrictEqual('1.0.1');
        // updates the package2 `@types/one` version to the latest version
        expect(
          packageJson2.devDependencies &&
            packageJson2.devDependencies['@types/one']
        ).toStrictEqual('1.0.1');

        // Check return value.
        expect(notFixed).toStrictEqual([
          {
            // Should not be fixed due to the abnormal version present.
            dependency: 'bar',
            versions: [
              {
                version: '^3.0.0',
                packages: [
                  expect.objectContaining({
                    path: join('@scope1', 'package1'),
                  }),
                ],
              },
              {
                version: 'invalidVersion',
                packages: [
                  expect.objectContaining({
                    path: join('@scope1', 'package2'),
                  }),
                ],
              },
            ],
          },
        ]);

        expect(fixed).toStrictEqual([
          {
            dependency: '@types/one',
            versions: [
              {
                version: '1.0.0',
                packages: [
                  expect.objectContaining({
                    path: join('@scope1', 'package2'),
                  }),
                ],
              },
              {
                version: '1.0.1',
                packages: [
                  expect.objectContaining({
                    path: join('@scope1', 'package1'),
                  }),
                ],
              },
            ],
          },
          {
            dependency: 'a.b.c',
            versions: [
              {
                version: '5.0.0',
                packages: [
                  expect.objectContaining({
                    path: join('@scope1', 'package1'),
                  }),
                ],
              },
              {
                version: '~5.5.0',
                packages: [
                  expect.objectContaining({
                    path: join('@scope1', 'package2'),
                  }),
                ],
              },
            ],
          },
          {
            dependency: 'foo',
            versions: [
              {
                version: '^1.0.0',
                packages: [
                  expect.objectContaining({
                    path: '.',
                  }),
                  expect.objectContaining({
                    path: join('@scope1', 'package1'),
                  }),
                ],
              },
              {
                version: '^2.0.0',
                packages: [
                  expect.objectContaining({
                    path: join('@scope1', 'package2'),
                  }),
                ],
              },
            ],
          },
          {
            dependency: 'one.two.three',
            versions: [
              {
                version: '^4.0.0',
                packages: [
                  expect.objectContaining({
                    path: join('@scope1', 'package2'),
                  }),
                ],
              },
              {
                version: '^4.1.0',
                packages: [
                  expect.objectContaining({
                    path: join('@scope1', 'package1'),
                  }),
                ],
              },
            ],
          },
        ]);

        // Existing newline at end of file should be maintained.
        expect(packageJson1Contents).not.toMatch(/\n$/); // package1 should not end in newline
        expect(packageJson2Contents).toMatch(/\n$/); // package2 should end in newline
      });
    });

    describe('inconsistent local package versions', function () {
      beforeEach(function () {
        // Create a mock workspace filesystem for temporary usage in this test because changes will be written to some files.
        mockFs({
          'package.json': JSON.stringify({
            workspaces: ['*'],
          }),
          package1: {
            'package.json': JSON.stringify({
              name: 'package1',
              version: '1.0.0',
              dependencies: {
                package2: '^1.0.0', // Lower than actual version of this local package.
              },
            }),
          },
          package2: {
            'package.json': JSON.stringify({
              name: 'package2',
              version: '2.0.0',
              dependencies: {
                package1: '^2.0.0', // Higher than actual version of this local package.
              },
            }),
          },
          package3: {
            'package.json': JSON.stringify({
              name: 'package3',
              dependencies: {
                package1: '^0.0.0', // Lower than actual version of this local package.
              },
            }),
          },
        });
      });

      afterEach(function () {
        mockFs.restore();
      });

      it('fixes the fixable inconsistencies', function () {
        const packages = getPackagesHelper('.');
        const mismatchingVersions = calculateMismatchingVersions(
          calculateVersionsForEachDependency(packages)
        );
        const { fixed, notFixed } = fixMismatchingVersions(
          packages,
          mismatchingVersions
        );

        // Read in package.json files.
        const packageJson1Contents = readFileSync(
          'package1/package.json',
          'utf8'
        );
        const packageJson2Contents = readFileSync(
          'package2/package.json',
          'utf8'
        );
        const packageJson3Contents = readFileSync(
          'package3/package.json',
          'utf8'
        );
        const packageJson1: PackageJson = JSON.parse(packageJson1Contents);
        const packageJson2: PackageJson = JSON.parse(packageJson2Contents);
        const packageJson3: PackageJson = JSON.parse(packageJson3Contents);

        expect(
          packageJson1.dependencies && packageJson1.dependencies['package2']
        ).toStrictEqual('^2.0.0');

        expect(
          packageJson2.dependencies && packageJson2.dependencies['package1']
        ).toStrictEqual('^2.0.0');

        expect(
          packageJson3.dependencies && packageJson3.dependencies['package1']
        ).toStrictEqual('^0.0.0');

        expect(notFixed).toStrictEqual([
          {
            // Not fixed since found version higher than actual version of this local package.
            dependency: 'package1',
            versions: [
              {
                version: '^0.0.0',
                packages: [expect.objectContaining({ path: 'package3' })],
              },
              {
                version: '1.0.0',
                packages: [expect.objectContaining({ path: 'package1' })],
              },
              {
                version: '^2.0.0',
                packages: [expect.objectContaining({ path: 'package2' })],
              },
            ],
          },
        ]);

        expect(fixed).toStrictEqual([
          {
            // Fixed since updated to actual version of this local package.
            dependency: 'package2',
            versions: [
              {
                version: '^1.0.0',
                packages: [
                  expect.objectContaining({
                    path: 'package1',
                  }),
                ],
              },
              {
                version: '2.0.0',
                packages: [
                  expect.objectContaining({
                    path: 'package2',
                  }),
                ],
              },
            ],
          },
        ]);
      });
    });

    describe('increasable range', function () {
      beforeEach(function () {
        // Create a mock workspace filesystem for temporary usage in this test because changes will be written to some files.
        mockFs({
          'package.json': JSON.stringify({
            workspaces: ['*'],
          }),
          package1: {
            'package.json': JSON.stringify({
              name: 'package1',
              dependencies: {
                foo: '^1.0.0',
              },
            }),
          },
          package2: {
            'package.json': JSON.stringify({
              name: 'package2',
              dependencies: {
                foo: '1.5.0',
              },
            }),
          },
        });
      });

      afterEach(function () {
        mockFs.restore();
      });

      it('increases the range', function () {
        const packages = getPackagesHelper('.');
        const mismatchingVersions = calculateMismatchingVersions(
          calculateVersionsForEachDependency(packages)
        );
        fixMismatchingVersions(packages, mismatchingVersions);

        // Read in package.json files.
        const packageJson1Contents = readFileSync(
          'package1/package.json',
          'utf8'
        );
        const packageJson2Contents = readFileSync(
          'package2/package.json',
          'utf8'
        );
        const packageJson1: PackageJson = JSON.parse(packageJson1Contents);
        const packageJson2: PackageJson = JSON.parse(packageJson2Contents);

        expect(
          packageJson1.dependencies && packageJson1.dependencies['foo']
        ).toStrictEqual('^1.5.0');

        expect(
          packageJson2.dependencies && packageJson2.dependencies['foo']
        ).toStrictEqual('^1.5.0');
      });
    });
  });
});
