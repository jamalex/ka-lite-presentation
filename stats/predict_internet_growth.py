from pylab import *
import scipy.optimize

def sigmoid(p, x):
    x0, y0, k = p
    y = 0.8 / (1 + np.exp(-k*(x-x0))) + y0
    return y

def residuals(p, x, y):
    return y - sigmoid(p, x)

project_until = 2020

rec = recfromcsv("percent-internet-users-by-economic-class.csv")

x_existing = arange(2000, 2012)
x_projected = arange(2000, project_until + 1)

y_poor = array(list(rec[0])) / 100
y_mid = array(list(rec[1])) / 100
y_rich = array(list(rec[2])) / 100

def plot_class_curve(y):
    p_guess=(np.median(x_existing), np.median(y), 1.0)
    p, cov = scipy.optimize.leastsq(residuals, p_guess, args=(x_existing, y)) 

    # Plot the results    
    plot(x_projected, sigmoid(p, x_projected) * 100, '-', linewidth=3)
    grid(True)
    show()
    scatter(x_existing, y * 100, s=50, c=(0,0,0))
    
    
plot_class_curve(y_rich)
plot_class_curve(y_mid)
plot_class_curve(y_poor)

xlim(2000, project_until)