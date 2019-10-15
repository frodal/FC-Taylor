%% ODF data to FC Taylor files

clf
close all
clear
clc

%% AA6060
[phi1,PHI,phi2]=importfile('AA6060\5microns_6060.txt',11,inf);
Area{1}=importfile6060('AA6060\5microns_6060.txt',11,inf);
Area{1}=Area{1}/min(Area{1});
TotArea{1}=sum(Area{1});

ID{1}=fopen('AA6060\Euler.inp','w');

fprintf(ID{1},'%s \n','**');
fprintf(ID{1},'%s \n','**');
fprintf(ID{1},'%s \n','** Euler angles file for AA6060');
fprintf(ID{1},'%s \n','**');
fprintf(ID{1},'%s \n','**');
fprintf(ID{1},'%s \n','*EULER');
fprintf(ID{1},'%s \n','**phi1,    PHI,   phi2,  weight');
for i=1:length(phi1)
    fprintf(ID{1},'%6.2f, %6.2f, %6.2f, %7.2f \n',phi1(i),PHI(i),phi2(i),Area{1}(i));
end
fcl{1}=fclose(ID{1});

%% AA6082.25
[phi1,PHI,phi2]=importfile('AA6082_25\prove5_608225.txt',9,inf);
Area{2}=importfile6082_25('AA6082_25\prove5_608225.txt',9,inf);
Area{2}=Area{2}/min(Area{2});
TotArea{2}=sum(Area{2});

ID{2}=fopen('AA6082_25\Euler.inp','w');

fprintf(ID{2},'%s \n','**');
fprintf(ID{2},'%s \n','**');
fprintf(ID{2},'%s \n','** Euler angles file for AA6082.25');
fprintf(ID{2},'%s \n','**');
fprintf(ID{2},'%s \n','**');
fprintf(ID{2},'%s \n','*EULER');
fprintf(ID{1},'%s \n','**phi1,    PHI,   phi2,  weight');
for i=1:length(phi1)
    fprintf(ID{2},'%6.2f, %6.2f, %6.2f, %7.2f \n',phi1(i),PHI(i),phi2(i),Area{2}(i));
end
fcl{2}=fclose(ID{2});

%% AA6082.50
[phi1,PHI,phi2]=importfile('AA6082_50\6082.50-1-grainfile-rotated.txt',18,inf);
Area{3}=importfile6082_50('AA6082_50\6082.50-1-grainfile-rotated.txt',18,inf);
Area{3}=Area{3}/min(Area{3});
TotArea{3}=sum(Area{3});

ID{3}=fopen('AA6082_50\Euler.inp','w');

fprintf(ID{3},'%s \n','**');
fprintf(ID{3},'%s \n','**');
fprintf(ID{3},'%s \n','** Euler angles file for AA6082.50');
fprintf(ID{3},'%s \n','**');
fprintf(ID{3},'%s \n','**');
fprintf(ID{3},'%s \n','*EULER');
fprintf(ID{1},'%s \n','**phi1,    PHI,   phi2,  weight');
for i=1:length(phi1)
    fprintf(ID{3},'%6.2f, %6.2f, %6.2f, %7.2f \n',phi1(i),PHI(i),phi2(i),Area{3}(i));
end
fcl{3}=fclose(ID{3});

%% Taylor AA6082.50
% Finds the most significant angles by area of each grain and ganerates a
% set of 2000 euler angles that represents the texture
% Nn=inf;
% cube=15;                % Number of cube oriented grains to match the real texture
% Ac=min(Area{3})-1;
% while Nn>2000
%     Ac=Ac+1;
%     Nn=round(Area{3}/Ac);
%     Nn=sum(Nn)+cube;
% end
% N=round(Area{3}/Ac);
% % Check if texture file for yieldsurface have the same texture
% ID{3}=fopen('..\AA6082_50\AA6082_50.ori','w');
% 
% fprintf(ID{3},'%s \n','6082.50TEX      EPS 0.000   texture from Wilhelm');
% fprintf(ID{3},'%s %2d \n','PHI2',SeriesRank);
% fprintf(ID{3},'%d %3d %2.1f \n',sum(N)+cube,0,GaussianSmoothing);
% for i=1:length(phi1)
%     for j=1:N(i)
%         fprintf(ID{3},'%4.2f %4.2f %4.2f %4.6f %4.2f \n',phi1(i),PHI(i),phi2(i),1,0);
%     end
% end
% for i=1:cube
%     fprintf(ID{3},'%4.2f %4.2f %4.2f %4.6f %4.2f \n',0,0,0,1,0);
% end
% fcl{3}=fclose(ID{3});

% Texture file for yieldsurface calculations
% ID{3}=fopen('..\..\Flyteflate Taylor\texture','w');
% 
% fprintf(ID{3},'%s \n','*Euler angles');
% fprintf(ID{3},'%s \n','*Material:');
% fprintf(ID{3},'%s \n','*Number of grains - Number of elements - Flag (0/1) for 4th column with grain number');
% fprintf(ID{3},'% 4d %3d %3d \n',sum(N)+cube,1,0);
% fprintf(ID{3},'%s \n','*phi1      PHI      phi2');
% for i=1:length(phi1)
%     for j=1:N(i)
%         fprintf(ID{3},'% 7.2f %8.2f %8.2f \n',phi1(i),PHI(i),phi2(i));
%     end
% end
% for i=1:cube
%     fprintf(ID{3},'% 7.2f %8.2f %8.2f \n',0,0,0);
% end
% fcl{3}=fclose(ID{3});

%% Average particle size
for i=1:3
    Dia{i}=2*sqrt(TotArea{i}/(length(Area{i})*pi));         % Average diameter based on average area of grains
    Diameter{i}=2*sqrt(Area{i}/pi);                         % Equivalent diameter of measured grains
    AvgDiameter{i}=sum(Diameter{i})/length(Diameter{i});    % Average of eq. diameters
end


