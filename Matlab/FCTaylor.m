%% Post-process the FC-Taylor data

clf
close all
clear
clc

filename='..\Output\output.txt';
[s11,s22,s33,s12,s23,s31,wp]=importfile1(filename);

% Normalizing the yield stress based on s11=1 at s22=0, s33=0
k=1;
er=inf;
s0=1;
for i=1:length(s11)
    estimate=sqrt(s22(i)^2+s33(i)^2+2*s12(i)^2+2*s23(i)^2+2*s31(i)^2);    % "distance" from s11 axis
    if (estimate<er)
        s0=abs(s11(i));
        er=estimate;
    end
end

s11=s11/s0;
s22=s22/s0;
s33=s33/s0;
s23=s23/s0;
s31=s31/s0;
s12=s12/s0;

%% Plotting
%% 2D
figure
plot(s11,s22,'k.')
hold on
% plot(-s11,-s22,'k.') % in case of centro symmetry
axis square
xlim([-1.5,1.5])
ylim([-1.5,1.5])

figure
plot(s11,s22,'k.')
hold on
tri=delaunay(s11,s22);
triplot(tri,s11,s22,'Color', [0,0,0])
axis square
xlim([-1.5,1.5])
ylim([-1.5,1.5])

%% 3D
figure
plot3(s11,s22,s12,'k.')
% hold on
% plot3(-s11,-s22,-s12,'k.') % in case of centro symmetry
axis square
xlim([-1.5,1.5])
ylim([-1.5,1.5])
zlim([-1.5,1.5])

figure
tri=delaunay(s11,s22,s12);
trisurf(tri,s11,s22,s12,'FaceColor', [0.5,0.5,0.5],'FaceAlpha',1)
axis square
grid off
xlim([-1.5,1.5])
ylim([-1.5,1.5])
zlim([-1.5,1.5])
