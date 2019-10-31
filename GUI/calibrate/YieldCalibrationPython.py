import numpy as np
import math
from scipy import optimize

def yieldfunction(s11,s22,s33,s12,s23,s31,c):
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

def ObjFun(c,s11,s22,s33,s12,s23,s31):
    
    if c[16]<2 or c[16]>30:
        return 1.e9
    
    N=s11.size
    f=np.zeros(N)
    for k in range(0,N):
        f[k]=yieldfunction(s11[k],s22[k],s33[k],s12[k],s23[k],s31[k],c)-1.0
    return sum(f**2)

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

##################################################################
# Input from CP-FEM
fileName = 'output.txt'
# Basinhopping input
niter=200 		# No. iteration in basinhopping
T=0.001			# The "temperature" parameter
stepsize=0.5	# Initial step size
solver='SLSQP'	# Minimizer to be used ('SLSQP','BFGS',...)
disp=False		# Should the status messages from basinhopping be printed?

##################################################################
## Starting calibration
print '-'*60
print 'Started Calibration'
print ''
## Loading CP-FEM data
s11, s22, s33, s12, s23, s31 = LoadTests(fileName)
# Normalize data by the yield stress
s11, s22, s33, s12, s23, s31 = Normalize(s11,s22,s33,s12,s23,s31)

## Initial guess
c0 = np.ones(17)
c0[16] = 8.0
c = c0
f = ObjFun(c, s11, s22, s33, s12, s23, s31)

# Trying to find global minimum
for i in range(0, 5):
    res = optimize.basinhopping(ObjFun, c0, niter=niter, T=T, stepsize=stepsize+0.1*i, minimizer_kwargs={'method': solver, 'args': (s11, s22, s33, s12, s23, s31)}, disp=disp)

    ctrial = res.x
    ftrial = ObjFun(ctrial, s11,s22, s33, s12, s23, s31)
    #print ''
    #print 'For step no. '+str(i+1)
    #print 'Minimum found: '+str(ftrial)
    #print 'Minimum from previous steps: '+str(f)
    #print ''

    if ftrial < f:
        c = ctrial
        f = ftrial

# Printing the function value at the possible global minimum
#print ''
print 'Minimum function value found: '+str(f)
print ''
# Writes the Possible global minimum parameters to a file
with open('CalibratedValues.dat', 'w') as file:
    file.write('%12.8f\n' % 1.0)
    file.write('%12.8f\n' % 1.0)
    for i in range(0, len(c)):
        file.write('%12.8f\n' % c[i])

##################################################################
