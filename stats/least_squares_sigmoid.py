from pylab import *
import scipy.optimize

def sigmoid(p, x):
    x0, y0, k=p
    y = 1 / (1 + np.exp(-k*(x-x0))) + y0
    return y

def residuals(p, x, y):
    return y - sigmoid(p, x)

rec = recfromcsv("percent-internet-users-by-economic-class.csv")

x = arange(2000, 2012)
y = array(list(rec[1])) / 100

p_guess=(np.median(x), np.median(y), 1.0)
p, cov, infodict, mesg, ier = scipy.optimize.leastsq(residuals, p_guess, args=(x,y), full_output=1) 

xp = arange(2000, 2030)
pxp=sigmoid(p, xp)

# Plot the results
plt.plot(x, y, '.', xp, pxp, '-')
plt.xlabel('x')
plt.ylabel('y', rotation='horizontal') 
plt.grid(True)
plt.show()