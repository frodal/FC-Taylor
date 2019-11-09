import numpy as np
from scipy import optimize
import enum
import argparse
from pathlib import Path

@enum.unique
class Space(enum.Enum):
    free3D  = enum.auto()
    fixed3D = enum.auto()
    free2D  = enum.auto()
    fixed2D = enum.auto()

def yieldfunction3D(s11,s22,s33,s12,s23,s31,c):
    ## YLD2004-18p yield surface f=(phi/4)^(1/m)-sigma_y
    # Yield surface parameters
    c1_12=1.0
    c1_13=1.0
    c1_21=c[0]
    c1_23=c[1]
    c1_31=c[2]
    c1_32=c[3]
    c1_44=c[4]
    c1_55=c[5]
    c1_66=c[6]
    
    c2_12=c[7]
    c2_13=c[8]
    c2_21=c[9]
    c2_23=c[10]
    c2_31=c[11]
    c2_32=c[12]
    c2_44=c[13]
    c2_55=c[14]
    c2_66=c[15]
    
    m=c[16]
    ## 
    # Deviatoric stress
    sxx=s11-(s11+s22+s33)/3.0
    syy=s22-(s11+s22+s33)/3.0
    szz=s33-(s11+s22+s33)/3.0
    
    # Stress tensor quantities of s'
    x1=-c1_12*syy-c1_13*szz
    y1=-c1_21*sxx-c1_23*szz
    z1=-c1_31*sxx-c1_32*syy
    xy1=c1_44*s12
    yz1=c1_55*s23
    xz1=c1_66*s31
    
    # Stress tensor quantities of s''
    x2=-c2_12*syy-c2_13*szz
    y2=-c2_21*sxx-c2_23*szz
    z2=-c2_31*sxx-c2_32*syy
    xy2=c2_44*s12
    yz2=c2_55*s23
    xz2=c2_66*s31
    
    # Calculate eigenvalues of s' and s''
    s1=np.linalg.eigvalsh(np.array([[x1,xy1,xz1],[xy1,y1,yz1],[xz1,yz1,z1]]))
    s2=np.linalg.eigvalsh(np.array([[x2,xy2,xz2],[xy2,y2,yz2],[xz2,yz2,z2]]))
    
    # calculate phi
    phi=0.0
    for a in s1:
        for b in s2:
            phi+=abs(a-b)**m
    
    return (phi/4.0)**(1.0/m)-1.0

def yieldfunction3Dfixed(s11,s22,s33,s12,s23,s31,c):
    return yieldfunction3D(s11,s22,s33,s12,s23,s31,np.append(c,[8.0]))

def yieldfunction2D(s11,s22,s33,s12,s23,s31,c):
    ## YLD2004-18p yield surface f=(phi/4)^(1/m)-sigma_y
    # Yield surface parameters
    c1_12=1.0
    c1_13=1.0
    c1_21=c[0]
    c1_23=c[1]
    c1_31=c[2]
    c1_32=c[3]
    c1_44=c[4]
    c1_55=1.0
    c1_66=1.0
    
    c2_12=c[5]
    c2_13=c[6]
    c2_21=c[7]
    c2_23=c[8]
    c2_31=c[9]
    c2_32=c[10]
    c2_44=c[11]
    c2_55=1.0
    c2_66=1.0
    
    m=c[12]
    ## 
    # Deviatoric stress
    sxx=s11-(s11+s22+s33)/3.0
    syy=s22-(s11+s22+s33)/3.0
    szz=s33-(s11+s22+s33)/3.0
    
    # Stress tensor quantities of s'
    x1=-c1_12*syy-c1_13*szz
    y1=-c1_21*sxx-c1_23*szz
    z1=-c1_31*sxx-c1_32*syy
    xy1=c1_44*s12
    yz1=c1_55*s23
    xz1=c1_66*s31
    
    # Stress tensor quantities of s''
    x2=-c2_12*syy-c2_13*szz
    y2=-c2_21*sxx-c2_23*szz
    z2=-c2_31*sxx-c2_32*syy
    xy2=c2_44*s12
    yz2=c2_55*s23
    xz2=c2_66*s31
    
    # Calculate eigenvalues of s' and s''
    s1=np.linalg.eigvalsh(np.array([[x1,xy1,xz1],[xy1,y1,yz1],[xz1,yz1,z1]]))
    s2=np.linalg.eigvalsh(np.array([[x2,xy2,xz2],[xy2,y2,yz2],[xz2,yz2,z2]]))
    
    # calculate phi
    phi=0.0
    for a in s1:
        for b in s2:
            phi+=abs(a-b)**m
    
    return (phi/4.0)**(1.0/m)-1.0

def yieldfunction2Dfixed(s11,s22,s33,s12,s23,s31,c):
    return yieldfunction2D(s11,s22,s33,s12,s23,s31,np.append(c,[8.0]))

def LoadTests(path):
    s11=[]
    s22=[]
    s33=[]
    s12=[]
    s23=[]
    s31=[]
    with open(path,'r') as file:
        next(file)
        for line in file:
            s11.append(float(line.split(',')[0]))
            s22.append(float(line.split(',')[1]))
            s33.append(float(line.split(',')[2]))
            s12.append(float(line.split(',')[3]))
            s23.append(float(line.split(',')[4]))
            s31.append(float(line.split(',')[5]))
    return np.array(s11), np.array(s22), np.array(s33), np.array(s12), np.array(s23), np.array(s31)

def ObjFun(c,s11,s22,s33,s12,s23,s31,YS):
    return sum(ObjFunVec(c,s11,s22,s33,s12,s23,s31,YS)**2)

def ObjFunVec(c,s11,s22,s33,s12,s23,s31,YS):
    
    N=s11.size
    f=np.zeros(N)
    n=len(c)

    if (n==17) and (c[16]<2 or c[16]>30):
        for k in range(N):
            f[k]=1.e9
        return f
    elif (n==13) and (c[12]<2 or c[12]>30):
        for k in range(N):
            f[k]=1.e9
        return f
    
    for k in range(N):
        f[k]=YS(s11[k],s22[k],s33[k],s12[k],s23[k],s31[k],c)
    return f

def GetYS(c):
    N = len(c)
    if N==17:
        return yieldfunction3D
    elif N==16:
        return yieldfunction3Dfixed
    elif N==13:
        return yieldfunction2D
    elif N==12:
        return yieldfunction2Dfixed
    else:
        return None

def GetInitial(choise):
    if choise == Space.fixed2D:
        c0 = np.zeros(12)
    elif choise == Space.free2D:
        c0 = np.zeros(13)
        c0[12] = 8.0
    elif choise == Space.fixed3D:
        c0 = np.zeros(16)
    elif choise == Space.free3D:
        c0 = np.zeros(17)
        c0[16] = 8.0
    else:
        c0 = np.zeros(12)
    return c0

def Normalize(s11,s22,s33,s12,s23,s31):
    er=np.inf
    s0=1.0
    for i in range(s11.size):
        estimate = np.sqrt(s22[i]**2+s33[i]**2+2*s12[i]**2+2*s23[i]**2+2*s31[i]**2)
        if (estimate<er):
            s0=abs(s11[i])
            er=estimate

    s11=s11/s0
    s22=s22/s0
    s33=s33/s0
    s12=s12/s0
    s23=s23/s0
    s31=s31/s0
    return s11, s22, s33, s12, s23, s31

def SaveResult(c,folder):
    with open(Path.joinpath(folder,'CalibratedParameters.dat'), 'w') as file:
        file.write('%12.8f\n' % 1.0)
        file.write('%12.8f\n' % 1.0)
        N = len(c)
        if N==17:
            for i in range(N-1):
                file.write('%12.8f\n' % c[i])
            file.write('%12.8f' % c[N-1])
        elif N==16:
            for i in range(N):
                file.write('%12.8f\n' % c[i])
            file.write('%12.8f' % 8.0)
        elif N==13:
            for i in range(5):
                file.write('%12.8f\n' % c[i])
            file.write('%12.8f\n' % 1.0)
            file.write('%12.8f\n' % 1.0)
            for i in range(5,N-1):
                file.write('%12.8f\n' % c[i])
            file.write('%12.8f\n' % 1.0)
            file.write('%12.8f\n' % 1.0)
            file.write('%12.8f' % c[N-1])
        elif N==12:
            for i in range(5):
                file.write('%12.8f\n' % c[i])
            file.write('%12.8f\n' % 1.0)
            file.write('%12.8f\n' % 1.0)
            for i in range(5,N):
                file.write('%12.8f\n' % c[i])
            file.write('%12.8f\n' % 1.0)
            file.write('%12.8f\n' % 1.0)
            file.write('%12.8f' % 8.0)

def OptimizeBasinhopping(s11, s22, s33, s12, s23, s31, choise):
    # Basinhopping input
    niter=200 		# No. iteration in basinhopping
    T=0.001			# The "temperature" parameter
    stepsize=0.5	# Initial step size
    solver='SLSQP'	# Minimizer to be used ('SLSQP','BFGS',...)
    disp=False		# Should the status messages from basinhopping be printed?
    ##################################################################

    c0 = GetInitial(choise)
    YieldFunc = GetYS(c0)

    c = c0
    f = ObjFun(c, s11, s22, s33, s12, s23, s31, YieldFunc)

    # Trying to find global minimum
    for i in range(0, 5):
        res = optimize.basinhopping(ObjFun, c0, niter=niter, T=T, stepsize=stepsize+0.1*i, minimizer_kwargs={'method': solver, 'args': (s11, s22, s33, s12, s23, s31, YieldFunc)}, disp=disp)

        ctrial = res.x
        ftrial = ObjFun(ctrial, s11,s22, s33, s12, s23, s31, YieldFunc)

        if ftrial < f:
            c = ctrial
            f = ftrial

    return c

def OptimizeMinimize(s11, s22, s33, s12, s23, s31, choise):
    # input
    niter=1000 		# Max no. iteration
    solver='SLSQP'	# Minimizer to be used ('SLSQP','BFGS',...)
    disp=False		# Should the status messages be printed?
    ##################################################################

    c0 = GetInitial(choise)
    YieldFunc = GetYS(c0)

    c = c0
    f = ObjFun(c, s11, s22, s33, s12, s23, s31, YieldFunc)

    res = optimize.minimize(ObjFun, c0, args=(s11, s22, s33, s12, s23, s31, YieldFunc), method=solver,options={'maxiter': niter, 'disp': disp})

    ctrial = res.x
    ftrial = ObjFun(ctrial, s11,s22, s33, s12, s23, s31, YieldFunc)

    if ftrial < f:
        c = ctrial
        f = ftrial

    return c

def OptimizeLS(s11, s22, s33, s12, s23, s31, choise):
    # input
    solver='lm'	# Minimizer to be used ('SLSQP','BFGS',...)
    ##################################################################

    c0 = GetInitial(choise)
    YieldFunc = GetYS(c0)

    c = c0
    f = ObjFun(c, s11, s22, s33, s12, s23, s31, YieldFunc)

    res = optimize.least_squares(ObjFunVec, c0, args=(s11, s22, s33, s12, s23, s31, YieldFunc), method=solver)

    ctrial = res.x
    ftrial = ObjFun(ctrial, s11,s22, s33, s12, s23, s31, YieldFunc)

    if ftrial < f:
        c = ctrial
        f = ftrial

    return c

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Calibrate the Yld2004-18p yield surface from discrete yield surface data.')
    parser.add_argument('inputFile',type=str,
                        help='Path to the input file with discrete yield surface data.')
    parser.add_argument('--space',default='2D',type=str,choices=['3D','2D'],
                        help='Choose where the test is run.'+
                        ' 3D: 3-dimensional calibration.'+
                        ' 2D: 2-dimensional calibration (Default option).')
    args = parser.parse_args()
    fileName = Path(args.inputFile)
    spaceInput = args.space

    assert (fileName.exists()),('Could not find input file: '+str(fileName))

    if spaceInput == '2D':
        choise = Space.fixed2D
    elif spaceInput == '3D':
        choise = Space.fixed3D

    c0 = GetInitial(choise)
    # Loading CP-FEM data
    s11, s22, s33, s12, s23, s31 = LoadTests(fileName)
    # Normalize data by the yield stress
    s11, s22, s33, s12, s23, s31 = Normalize(s11,s22,s33,s12,s23,s31)

    if len(c0)>len(s11):
        c = OptimizeMinimize(s11, s22, s33, s12, s23, s31, choise)
    else:
        c = OptimizeLS(s11, s22, s33, s12, s23, s31, choise)
    # c = OptimizeBasinhopping(s11, s22, s33, s12, s23, s31, choise)

    # Writes the parameters to a file
    SaveResult(c,fileName.parent)

##################################################################
if __name__=="__main__":
    main()