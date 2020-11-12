##----------------------------------------------------------------------
## Import libraries
##----------------------------------------------------------------------
import os
from pathlib import Path
import shutil
import argparse
import pandas as pd
from scipy import interpolate
import numpy as np
import matplotlib.pyplot as plt
##----------------------------------------------------------------------
## Print colored text class
##----------------------------------------------------------------------


class printColors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
##----------------------------------------------------------------------
## Test class
##----------------------------------------------------------------------


class Test:
    # Constructor
    def __init__(self, name='Test'):
        assert isinstance(name, str), 'Test name should be a string!'
        self.name = name
##----------------------------------------------------------------------


class GUITest(Test):
    # Constructor
    def __init__(self, name):
        # Calls the base (super) class's constructor
        super().__init__(name)
        # Current directory
        pythonPath = Path(__file__).parent
        # Sets up the Abaqus folder path, the test working directory path, and reference data path
        self.testResultPath = pythonPath.joinpath(
            'TestResults').joinpath('Test-'+self.name)
        self.referencePath = pythonPath.joinpath(
            'ReferenceData').joinpath('Test-'+self.name)
        # Initialize
        self.passed = False
        self.residual = np.inf

    # Post-process the test
    def Process(self, shouldPlot=False):
        self.passed = False
        self.residual = np.inf
        # Read test result
        try:
            testData = pd.read_csv(
                self.testResultPath.joinpath('output.csv')).T.to_numpy()
        except:
            return self.passed
        # Read reference data
        try:
            referenceData = pd.read_csv(
                self.referencePath.joinpath('output.csv')).T.to_numpy()
        except:
            assert (False), 'Could not read the test reference data'
            return self.passed

        # # Check shape of data
        if np.shape(referenceData) != np.shape(testData):
            return self.passed
        # # Calculates the residual of the test
        self.residual = np.sum(np.sqrt((referenceData[0]-testData[0])**2 +
                                       (referenceData[1]-testData[1])**2 +
                                       (referenceData[2]-testData[2])**2 +
                                       (referenceData[3]-testData[3])**2 +
                                       (referenceData[4]-testData[4])**2 +
                                       (referenceData[5]-testData[5])**2))*10.0/np.shape(testData)[1]
        self.passed = self.residual < 0.1
        if not self.passed:
            # TODO: Check if some points have been moved compared to the reference data?
            pass
        # Plot results
        if shouldPlot:
            plt.figure()
            maxLim = np.max([np.max(referenceData[0]),
                             np.max(referenceData[1])])*1.5
            plt.axis([-maxLim, maxLim, -maxLim, maxLim])
            plt.plot(referenceData[0], referenceData[1], 'ko')
            plt.plot(testData[0], testData[1], 'b.')
        return self.passed
##----------------------------------------------------------------------


class FortranTest(Test):
    # Constructor
    def __init__(self, name):
        # Calls the base (super) class's constructor
        super().__init__(name)

    # Runs the test
    def Run(self):
        pass

    # Post-process the test
    def Process(self):
        pass
    # TODO: Implement tests to test parts of the Fortran code
##----------------------------------------------------------------------
## Post-process tests
##----------------------------------------------------------------------


def PostProcess(tests, shouldPlot=False):
    for test in tests:
        test.Process(shouldPlot)
        if test.passed:
            print('{}PASSED{} test {:40} residual = {:e}'.format(
                printColors.OKGREEN, printColors.ENDC, test.name, test.residual))
        else:
            print('{}FAILED{} test {:40} residual = {:e}'.format(
                printColors.FAIL, printColors.ENDC, test.name, test.residual))
        if shouldPlot:
            plt.show()
##----------------------------------------------------------------------
## Main
##----------------------------------------------------------------------


def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(
        description='Run tests for the SCMM-hypo subroutine.')
    parser.add_argument('action', type=str, choices=['run', 'clean', 'post'],
                        help='Choose what to do.' +
                        ' "post": For post-processing the results.')
    parser.add_argument('--plot', default=False, const=True, action='store_const',
                        help='Add this flag to plot the reference data and the test data during post-processing.')
    args = parser.parse_args()
    action = args.action
    shouldPlot = args.plot

    # Creates the tests
    tests = [GUITest(name) for name in ['AA6060', 'AA6082.25', 'AA6082.50']]

    # Do stuff
    if action == 'post':
        PostProcess(tests, shouldPlot)


##----------------------------------------------------------------------
## Entry point
##----------------------------------------------------------------------
if __name__ == '__main__':
    main()
