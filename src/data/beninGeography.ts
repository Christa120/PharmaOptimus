/**
 * Données géographiques authentiques et réseau routier du Bénin
 * Couvre les 12 départements, les 77 communes, les corridors routiers nationaux (RNIE)
 * et les agglomérations majeures ainsi que les quartiers urbains.
 */

import { DepartmentInfo, CityInfo, GeoCoordinate } from '../types/pharma';

// Bornes géographiques du Bénin
export const BENIN_BOUNDS = {
  lonMin: 0.70,
  lonMax: 3.90,
  latMin: 6.18,
  latMax: 12.45,
};

// Projection des coordonnées géographiques (WGS84) vers le canevas SVG standardisé
export function projectGeoToSvg(coord: GeoCoordinate, width = 540, height = 860): { x: number; y: number } {
  const normX = (coord.lon - BENIN_BOUNDS.lonMin) / (BENIN_BOUNDS.lonMax - BENIN_BOUNDS.lonMin);
  const normY = (coord.lat - BENIN_BOUNDS.latMin) / (BENIN_BOUNDS.latMax - BENIN_BOUNDS.latMin);
  
  const x = Math.round(normX * width * 10) / 10;
  const y = Math.round((height - (normY * height)) * 10) / 10;
  return { x, y };
}

// 12 Départements du Bénin avec contours géographiques réalistes et fidèles à la géomorphologie nationale
export const DEPARTMENTS_DATA: DepartmentInfo[] = [
  {
    name: 'Alibori',
    capital: 'Kandi',
    population: 868046,
    climateZone: 'Nord (Unimodal + Harmattan)',
    avgRainMmAnnual: 950,
    riskHealthScore: 78,
    labelCoord: { lat: 11.45, lon: 2.85 },
    svgPath: 'M 529.6 241.2 L 525.0 233.7 L 519.7 227.4 L 514.0 223.1 L 516.6 214.2 L 510.7 194.6 L 510.7 183.5 L 505.8 180.7 L 472.0 157.8 L 477.5 133.3 L 481.8 120.6 L 488.2 106.4 L 482.7 100.2 L 475.9 95.6 L 471.1 88.3 L 461.9 85.4 L 456.4 81.2 L 447.7 79.6 L 439.4 78.5 L 430.8 63.6 L 417.9 54.6 L 407.6 46.8 L 391.9 37.4 L 388.8 27.6 L 376.2 21.8 L 361.8 8.5 L 353.4 5.3 L 345.1 7.7 L 340.0 11.8 L 334.8 14.0 L 332.1 20.7 L 324.4 18.8 L 319.5 19.8 L 314.9 21.3 L 309.5 22.9 L 302.9 20.6 L 301.4 25.9 L 297.6 23.1 L 296.0 27.2 L 293.3 24.8 L 290.1 25.2 L 283.3 25.4 L 286.7 39.4 L 287.5 45.9 L 289.5 51.7 L 293.9 59.3 L 301.8 63.6 L 295.6 65.9 L 288.1 68.5 L 290.1 76.6 L 289.3 82.9 L 286.5 89.6 L 281.2 95.9 L 274.9 102.1 L 274.9 110.3 L 267.8 112.2 L 260.3 116.1 L 235.3 132.6 L 266.1 200.7 L 285.7 210.3 L 272.0 218.6 L 267.4 235.3 L 285.8 267.7 L 302.5 263.9 L 317.3 271.0 L 340.1 274.0 L 351.3 265.1 L 373.2 269.4 L 390.5 271.4 L 421.5 265.1 L 454.7 257.6 L 483.1 251.2 L 513.0 246.6 L 529.6 241.2 Z',
  },
  {
    name: 'Atacora',
    capital: 'Natitingou',
    population: 769337,
    climateZone: 'Nord (Unimodal + Harmattan)',
    avgRainMmAnnual: 1150,
    riskHealthScore: 82,
    labelCoord: { lat: 10.70, lon: 1.65 },
    svgPath: 'M 268.6 265.4 L 268.2 228.3 L 272.0 218.6 L 279.4 212.4 L 280.1 204.2 L 266.1 200.7 L 224.9 139.3 L 213.4 138.5 L 202.8 136.3 L 195.9 137.0 L 191.9 137.4 L 186.8 138.2 L 181.1 139.6 L 174.1 138.9 L 165.9 142.3 L 158.1 144.0 L 150.7 141.9 L 146.1 137.5 L 138.0 136.3 L 133.9 135.9 L 126.7 134.0 L 119.9 136.5 L 115.2 140.2 L 115.3 145.0 L 109.6 146.9 L 104.7 149.9 L 105.9 153.7 L 106.4 158.0 L 97.5 157.3 L 92.5 155.9 L 92.5 158.7 L 95.6 161.4 L 92.9 165.3 L 87.6 162.9 L 77.7 164.1 L 74.9 161.8 L 71.0 163.9 L 73.6 169.0 L 76.4 174.7 L 74.0 177.7 L 68.7 176.8 L 61.3 180.7 L 59.2 183.0 L 62.9 182.9 L 65.7 187.0 L 69.6 192.8 L 70.4 195.3 L 64.9 193.2 L 58.3 193.1 L 51.3 190.5 L 43.1 189.8 L 41.7 194.1 L 40.0 199.0 L 34.1 201.9 L 32.4 217.7 L 27.7 228.5 L 14.9 240.7 L 16.4 255.9 L 11.9 266.4 L 110.6 336.0 L 112.3 337.7 L 157.0 334.6 L 168.4 329.4 L 173.2 323.2 L 187.9 324.0 L 193.8 327.4 L 207.5 326.9 L 217.7 326.4 L 225.6 326.2 L 234.6 327.3 L 239.8 326.8 L 253.7 327.1 L 267.0 322.4 L 270.5 314.7 L 266.7 303.8 L 259.9 291.8 L 254.0 285.6 L 255.6 276.9 L 266.9 268.6 L 268.6 265.4 Z',
  },
  {
    name: 'Borgou',
    capital: 'Parakou',
    population: 1202095,
    climateZone: 'Nord (Unimodal + Harmattan)',
    avgRainMmAnnual: 1100,
    riskHealthScore: 64,
    labelCoord: { lat: 9.75, lon: 2.80 },
    svgPath: 'M 529.6 241.2 L 513.0 246.6 L 483.1 251.2 L 454.7 257.6 L 421.5 265.1 L 390.5 271.4 L 373.2 269.4 L 351.3 265.1 L 340.1 274.0 L 317.3 271.0 L 302.5 263.9 L 285.8 267.7 L 268.2 265.3 L 255.6 276.9 L 256.0 290.1 L 266.7 303.8 L 270.7 317.3 L 253.7 327.1 L 239.4 327.3 L 239.6 334.7 L 236.0 341.6 L 235.1 355.8 L 239.0 374.8 L 248.5 385.4 L 241.1 418.1 L 230.9 424.6 L 216.1 433.3 L 215.1 453.4 L 228.3 461.9 L 223.3 475.8 L 222.2 486.7 L 236.4 497.3 L 252.2 500.0 L 251.4 506.4 L 343.0 505.4 L 345.0 500.5 L 345.8 496.4 L 349.6 488.4 L 348.2 484.1 L 349.8 473.7 L 351.8 463.8 L 368.0 463.2 L 380.0 460.9 L 392.2 461.9 L 404.6 455.3 L 411.5 438.1 L 414.2 424.1 L 411.2 411.8 L 419.9 402.4 L 427.3 393.5 L 430.0 387.7 L 435.1 382.7 L 443.7 381.5 L 445.7 374.7 L 443.8 366.8 L 447.0 359.9 L 455.7 356.6 L 467.1 353.3 L 476.2 352.2 L 491.6 329.9 L 492.8 321.4 L 499.3 317.1 L 502.1 310.8 L 500.9 305.3 L 493.8 302.4 L 491.1 298.4 L 495.4 280.4 L 496.6 275.2 L 503.2 271.1 L 511.5 272.8 L 520.7 273.4 L 523.7 262.7 L 526.0 257.0 L 530.4 249.8 Z',
  },
  {
    name: 'Donga',
    capital: 'Djougou',
    population: 539314,
    climateZone: 'Transition Centre',
    avgRainMmAnnual: 1200,
    riskHealthScore: 71,
    labelCoord: { lat: 9.50, lon: 1.70 },
    svgPath: 'M 239.4 327.3 L 230.3 327.3 L 221.7 326.6 L 212.2 327.0 L 199.0 326.7 L 190.8 325.8 L 185.3 321.7 L 170.5 326.7 L 163.8 331.8 L 150.1 336.0 L 111.3 336.8 L 111.3 349.3 L 113.5 359.4 L 112.1 366.2 L 112.5 376.6 L 113.8 385.3 L 109.5 393.0 L 110.5 399.7 L 113.3 405.2 L 116.6 404.6 L 121.4 427.5 L 140.2 445.2 L 149.1 454.8 L 152.6 462.4 L 153.7 477.5 L 155.3 495.2 L 154.9 526.5 L 161.5 529.6 L 180.3 527.0 L 190.5 527.8 L 201.2 534.9 L 212.0 536.9 L 221.2 543.0 L 231.2 545.5 L 240.2 547.4 L 250.2 546.4 L 254.7 543.9 L 252.2 538.1 L 254.2 521.7 L 251.2 512.4 L 250.2 507.2 L 252.2 504.6 L 252.2 500.0 L 240.6 498.5 L 228.9 494.1 L 222.2 486.7 L 222.5 480.2 L 225.0 471.3 L 228.3 461.9 L 222.2 458.1 L 214.2 447.0 L 216.1 433.3 L 221.0 425.7 L 235.8 425.0 L 241.1 418.1 L 243.4 406.7 L 245.9 381.0 L 239.0 374.8 L 234.9 363.6 L 237.5 349.3 L 236.0 341.6 L 239.3 337.9 L 238.5 332.2 L 239.4 327.3 Z',
  },
  {
    name: 'Collines',
    capital: 'Dassa-Zoumè',
    population: 716558,
    climateZone: 'Transition Centre',
    avgRainMmAnnual: 1150,
    riskHealthScore: 59,
    labelCoord: { lat: 8.20, lon: 2.25 },
    svgPath: 'M 251.4 506.4 L 250.0 509.7 L 252.9 519.2 L 254.5 533.9 L 253.5 542.0 L 252.9 545.0 L 246.1 547.6 L 236.2 546.9 L 226.1 545.2 L 216.6 540.8 L 208.1 535.0 L 196.6 531.9 L 183.7 526.0 L 172.5 528.9 L 155.6 529.1 L 154.6 526.3 L 154.9 534.5 L 158.1 545.2 L 155.0 553.8 L 154.0 558.8 L 156.5 575.5 L 156.0 621.2 L 157.8 638.3 L 156.8 646.2 L 157.5 658.2 L 175.8 659.3 L 203.5 663.7 L 221.5 669.2 L 242.2 675.5 L 252.5 676.7 L 260.2 678.0 L 266.1 679.9 L 274.9 685.4 L 280.6 687.3 L 287.2 685.9 L 290.9 682.8 L 297.0 677.0 L 299.8 673.9 L 298.5 668.2 L 299.4 664.4 L 301.4 660.2 L 341.4 658.7 L 341.8 648.3 L 340.8 635.8 L 337.0 631.5 L 333.6 625.7 L 336.4 613.9 L 338.3 602.6 L 340.0 596.6 L 339.8 592.2 L 342.6 588.6 L 343.9 584.0 L 342.1 578.8 L 338.7 571.9 L 337.5 561.6 L 340.1 552.3 L 344.8 544.6 L 344.9 537.4 L 345.0 528.6 L 344.0 522.2 L 344.1 519.4 L 344.3 515.7 L 343.8 512.3 L 321.0 505.8 L 251.4 506.4 Z',
  },
  {
    name: 'Zou',
    capital: 'Abomey',
    population: 851623,
    climateZone: 'Sud (Bimodal)',
    avgRainMmAnnual: 1100,
    riskHealthScore: 54,
    labelCoord: { lat: 7.25, lon: 2.10 },
    svgPath: 'M 157.5 658.2 L 158.8 675.4 L 159.2 675.6 L 160.4 676.2 L 163.5 678.5 L 166.6 683.2 L 169.9 689.0 L 174.8 699.2 L 177.2 702.4 L 176.4 705.4 L 177.3 707.3 L 181.0 708.9 L 182.8 710.0 L 185.0 713.1 L 187.1 714.2 L 188.6 715.9 L 189.1 717.9 L 190.0 719.8 L 192.5 721.2 L 194.1 722.6 L 194.9 724.5 L 195.8 726.7 L 196.2 728.8 L 196.0 730.5 L 197.6 733.2 L 199.5 736.1 L 203.4 741.3 L 206.9 744.7 L 211.8 750.4 L 213.7 751.6 L 214.7 753.2 L 217.2 756.2 L 220.0 759.3 L 223.5 762.5 L 226.4 763.3 L 229.6 761.5 L 232.6 760.8 L 234.0 760.5 L 237.2 760.1 L 263.9 755.4 L 271.9 751.0 L 275.1 755.3 L 279.5 751.4 L 281.0 749.8 L 282.6 748.6 L 285.1 748.7 L 286.5 749.2 L 287.1 750.1 L 287.9 751.5 L 288.0 751.6 L 306.8 750.9 L 309.5 751.2 L 310.5 749.4 L 310.7 744.2 L 309.6 738.5 L 308.9 734.5 L 306.4 729.5 L 307.3 725.0 L 304.3 722.7 L 301.3 722.3 L 298.5 720.6 L 296.9 718.7 L 292.9 707.7 L 290.6 701.7 L 290.8 696.8 L 290.4 691.5 L 287.7 689.8 L 287.2 685.9 L 284.9 686.6 L 280.6 687.3 L 276.3 686.3 L 274.9 685.4 L 269.8 681.2 L 266.1 679.9 L 263.3 678.8 L 260.2 678.0 L 257.1 676.8 L 252.5 676.7 L 247.6 675.9 L 242.2 675.5 L 231.7 673.8 L 221.5 669.2 L 215.4 667.8 L 203.5 663.7 L 186.7 661.1 L 175.8 659.3 L 167.7 659.5 L 157.5 658.2 Z',
  },
  {
    name: 'Plateau',
    capital: 'Pobè',
    population: 624146,
    climateZone: 'Sud (Bimodal)',
    avgRainMmAnnual: 1250,
    riskHealthScore: 61,
    labelCoord: { lat: 7.10, lon: 2.65 },
    svgPath: 'M 287.2 685.9 L 287.7 689.8 L 290.4 691.5 L 290.8 696.8 L 290.6 701.7 L 292.9 707.7 L 296.9 718.7 L 298.5 720.6 L 301.3 722.3 L 304.3 722.7 L 307.3 725.0 L 306.4 729.5 L 308.9 734.5 L 309.6 738.5 L 310.7 744.2 L 310.5 749.4 L 309.5 751.2 L 308.7 752.7 L 307.1 758.9 L 306.6 764.5 L 308.9 770.4 L 319.2 788.2 L 324.2 803.4 L 325.3 806.6 L 326.2 807.2 L 338.7 807.7 L 341.1 808.7 L 341.8 807.7 L 343.0 801.0 L 341.6 798.5 L 342.2 795.8 L 342.9 793.8 L 343.4 792.0 L 344.6 790.3 L 346.1 789.4 L 349.7 789.5 L 351.1 786.6 L 348.7 781.4 L 347.1 777.3 L 344.1 777.6 L 341.8 775.9 L 341.0 773.0 L 341.8 769.9 L 343.2 767.6 L 342.7 765.2 L 342.6 762.6 L 343.3 761.1 L 343.4 757.7 L 341.1 755.3 L 339.2 754.4 L 339.5 752.7 L 340.3 749.1 L 341.6 746.2 L 343.2 744.7 L 347.6 742.2 L 350.4 740.3 L 347.7 738.4 L 345.9 737.5 L 343.7 734.9 L 343.1 732.7 L 344.7 730.3 L 346.4 728.9 L 347.4 725.9 L 347.2 720.8 L 347.4 714.2 L 345.5 710.7 L 345.2 704.1 L 345.4 698.8 L 344.9 693.0 L 345.9 689.8 L 348.5 689.4 L 350.7 688.7 L 351.5 687.1 L 351.9 684.3 L 352.4 681.8 L 352.4 679.8 L 351.8 677.7 L 348.2 676.2 L 346.6 675.0 L 346.3 673.4 L 345.3 671.9 L 342.8 670.6 L 341.7 668.2 L 341.4 658.7 L 325.5 659.4 L 301.4 660.2 L 300.6 662.8 L 299.4 664.4 L 298.8 666.3 L 298.5 668.2 L 299.6 671.4 L 299.8 673.9 L 298.9 675.6 L 297.0 677.0 L 294.1 678.3 L 290.9 682.8 L 289.6 685.3 L 287.2 685.9 Z',
  },
  {
    name: 'Couffo',
    capital: 'Aplahoué',
    population: 741895,
    climateZone: 'Sud (Bimodal)',
    avgRainMmAnnual: 1050,
    riskHealthScore: 67,
    labelCoord: { lat: 6.95, lon: 1.85 },
    svgPath: 'M 159.2 675.6 L 159.2 679.5 L 158.5 682.4 L 158.5 691.2 L 158.1 703.6 L 158.9 724.3 L 159.1 744.7 L 159.4 747.7 L 155.8 747.9 L 150.0 747.8 L 146.8 746.6 L 144.6 745.7 L 143.4 746.2 L 144.6 748.5 L 145.3 750.7 L 146.7 754.4 L 147.7 756.5 L 149.4 758.5 L 152.0 760.1 L 152.6 759.9 L 153.3 762.9 L 152.6 764.2 L 153.2 767.2 L 152.8 769.3 L 152.5 771.3 L 152.3 772.7 L 153.5 773.7 L 154.3 775.1 L 154.6 776.5 L 155.5 777.8 L 156.4 779.9 L 156.6 781.1 L 155.9 782.5 L 154.7 783.3 L 153.6 784.6 L 156.6 784.9 L 162.5 783.5 L 167.2 782.0 L 171.6 779.9 L 177.7 778.9 L 184.4 777.6 L 189.1 777.6 L 193.9 777.4 L 197.4 778.9 L 201.3 781.1 L 202.6 784.2 L 204.6 787.4 L 209.5 789.0 L 221.2 793.7 L 224.0 789.4 L 225.1 786.4 L 225.0 783.3 L 227.2 777.9 L 229.5 775.6 L 231.2 772.9 L 230.9 769.6 L 231.1 768.0 L 234.4 766.9 L 234.5 765.0 L 233.4 763.2 L 232.6 760.8 L 229.6 761.5 L 226.4 763.3 L 223.5 762.5 L 220.0 759.3 L 217.2 756.2 L 214.7 753.2 L 213.7 751.6 L 211.8 750.4 L 206.9 744.7 L 203.4 741.3 L 199.5 736.1 L 197.6 733.2 L 196.0 730.5 L 196.2 728.8 L 195.8 726.7 L 194.9 724.5 L 194.1 722.6 L 192.5 721.2 L 190.0 719.8 L 189.1 717.9 L 188.6 715.9 L 187.1 714.2 L 185.0 713.1 L 182.8 710.0 L 181.0 708.9 L 177.3 707.3 L 176.4 705.4 L 177.2 702.4 L 174.8 699.2 L 169.9 689.0 L 166.6 683.2 L 163.5 678.5 L 160.4 676.2 L 159.2 675.6 Z',
  },
  {
    name: 'Mono',
    capital: 'Lokossa',
    population: 495307,
    climateZone: 'Sud (Bimodal)',
    avgRainMmAnnual: 1000,
    riskHealthScore: 58,
    labelCoord: { lat: 6.55, lon: 1.80 },
    svgPath: 'M 153.6 784.6 L 152.2 784.8 L 151.1 785.5 L 151.6 786.7 L 151.5 787.9 L 150.6 788.6 L 150.1 790.3 L 151.6 791.8 L 152.7 792.6 L 153.7 793.7 L 155.1 795.7 L 155.4 796.8 L 155.2 798.7 L 156.4 800.0 L 155.8 801.5 L 156.6 803.2 L 159.4 803.3 L 160.2 803.9 L 160.9 805.4 L 162.9 806.2 L 164.9 805.6 L 165.5 806.6 L 165.8 808.3 L 167.7 809.6 L 169.6 810.2 L 169.8 812.3 L 170.5 814.8 L 170.2 816.7 L 171.7 818.5 L 175.3 818.9 L 177.2 820.1 L 179.1 821.9 L 179.6 823.5 L 179.8 824.9 L 180.7 826.1 L 182.5 827.5 L 182.3 829.0 L 183.2 831.3 L 184.6 834.0 L 186.0 839.1 L 187.7 843.2 L 188.0 845.7 L 188.0 847.0 L 188.5 848.9 L 186.3 849.3 L 182.8 849.9 L 179.3 850.1 L 176.2 850.4 L 174.1 850.7 L 169.3 851.2 L 166.6 851.8 L 163.6 851.8 L 162.1 852.7 L 160.7 853.3 L 161.7 855.8 L 165.1 855.6 L 168.1 855.1 L 170.6 854.6 L 172.8 854.0 L 177.4 854.2 L 182.7 854.2 L 186.7 853.3 L 190.3 852.4 L 191.6 852.1 L 194.4 852.1 L 196.0 852.3 L 198.3 851.9 L 199.0 851.4 L 200.0 850.8 L 200.5 850.8 L 203.3 850.7 L 207.9 850.5 L 213.3 850.4 L 218.0 850.2 L 219.8 850.2 L 219.8 850.2 L 219.6 848.4 L 219.3 846.9 L 218.8 845.7 L 219.1 844.3 L 217.5 843.1 L 216.7 840.4 L 215.7 838.8 L 213.9 835.1 L 213.7 832.4 L 215.2 829.1 L 216.4 826.7 L 217.5 823.5 L 218.8 818.6 L 218.8 814.8 L 219.4 812.8 L 218.5 810.7 L 217.9 807.9 L 217.8 805.1 L 217.7 803.1 L 219.1 801.1 L 221.2 799.4 L 222.7 797.6 L 223.0 796.2 L 222.0 794.6 L 221.2 793.7 L 209.5 789.0 L 204.6 787.4 L 202.6 784.2 L 201.3 781.1 L 197.4 778.9 L 193.9 777.4 L 189.1 777.6 L 184.4 777.6 L 177.7 778.9 L 171.6 779.9 L 167.2 782.0 L 162.5 783.5 L 156.6 784.9 L 153.6 784.6 Z',
  },
  {
    name: 'Atlantique',
    capital: 'Allada',
    population: 1396548,
    climateZone: 'Sud (Bimodal)',
    avgRainMmAnnual: 1200,
    riskHealthScore: 48,
    labelCoord: { lat: 6.65, lon: 2.25 },
    svgPath: 'M 232.6 760.8 L 233.4 763.2 L 234.5 765.0 L 234.4 766.9 L 231.1 768.0 L 230.9 769.6 L 231.2 772.9 L 229.5 775.6 L 227.2 777.9 L 225.0 783.3 L 225.1 786.4 L 224.0 789.4 L 221.2 793.7 L 222.0 794.6 L 223.0 796.2 L 222.7 797.6 L 221.2 799.4 L 219.1 801.1 L 217.7 803.1 L 217.8 805.1 L 217.9 807.9 L 218.5 810.7 L 219.4 812.8 L 218.8 814.8 L 218.8 818.6 L 217.5 823.5 L 216.4 826.7 L 215.2 829.1 L 213.7 832.4 L 213.9 835.1 L 215.7 838.8 L 216.7 840.4 L 217.5 843.1 L 219.1 844.3 L 218.8 845.7 L 219.3 846.9 L 219.6 848.4 L 219.8 850.2 L 243.9 847.5 L 255.0 846.7 L 270.7 844.4 L 275.1 843.7 L 275.2 843.2 L 275.2 843.2 L 274.9 842.8 L 275.0 840.9 L 277.2 836.5 L 279.7 832.0 L 284.0 831.1 L 287.0 829.7 L 289.9 828.9 L 294.0 827.9 L 296.1 827.7 L 298.6 827.9 L 299.7 828.2 L 299.7 826.9 L 300.3 825.4 L 300.4 823.5 L 300.2 822.0 L 300.0 819.6 L 299.8 818.0 L 299.0 817.3 L 297.7 816.6 L 296.2 815.9 L 294.1 815.2 L 292.0 814.4 L 292.9 808.4 L 291.8 804.3 L 291.6 800.8 L 290.5 783.5 L 289.0 770.7 L 288.3 768.1 L 287.2 766.0 L 285.5 764.5 L 282.6 761.7 L 281.5 760.7 L 281.6 759.5 L 287.7 751.6 L 287.9 751.5 L 287.1 750.1 L 286.5 749.2 L 285.1 748.7 L 282.6 748.6 L 281.0 749.8 L 279.5 751.4 L 275.1 755.3 L 271.9 751.0 L 263.9 755.4 L 237.2 760.1 L 234.0 760.5 L 232.6 760.8 Z',
  },
  {
    name: 'Littoral',
    capital: 'Cotonou',
    population: 678874,
    climateZone: 'Sud (Bimodal)',
    avgRainMmAnnual: 1300,
    riskHealthScore: 42,
    labelCoord: { lat: 6.36, lon: 2.42 },
    svgPath: 'M 275.2 843.2 L 278.4 842.9 L 281.1 842.9 L 284.8 842.7 L 288.7 842.3 L 291.4 841.4 L 295.1 841.1 L 298.8 840.1 L 304.9 838.9 L 309.2 838.6 L 311.8 838.2 L 311.6 838.2 L 311.8 838.2 L 309.2 835.6 L 307.5 834.0 L 305.6 832.0 L 304.0 830.6 L 300.7 829.1 L 299.7 828.2 L 299.7 828.2 L 298.6 827.9 L 296.1 827.7 L 294.0 827.9 L 289.9 828.9 L 287.0 829.7 L 284.0 831.1 L 279.7 832.0 L 277.2 836.5 L 275.0 840.9 L 274.9 842.8 L 275.2 843.2 L 275.2 843.2 Z',
  },
  {
    name: 'Ouémé',
    capital: 'Porto-Novo',
    population: 1096850,
    climateZone: 'Sud (Bimodal)',
    avgRainMmAnnual: 1250,
    riskHealthScore: 51,
    labelCoord: { lat: 6.50, lon: 2.58 },
    svgPath: 'M 309.5 751.2 L 306.8 750.9 L 288.0 751.6 L 287.9 751.5 L 287.7 751.6 L 281.6 759.5 L 281.5 760.7 L 282.6 761.7 L 285.5 764.5 L 287.2 766.0 L 288.3 768.1 L 289.0 770.7 L 290.5 783.5 L 291.6 800.8 L 291.8 804.3 L 292.9 808.4 L 292.0 814.4 L 294.1 815.2 L 296.2 815.9 L 297.7 816.6 L 299.0 817.3 L 299.8 818.0 L 300.0 819.6 L 300.2 822.0 L 300.4 823.5 L 300.3 825.4 L 299.7 826.9 L 299.7 828.2 L 299.7 828.2 L 300.7 829.1 L 304.0 830.6 L 305.6 832.0 L 307.5 834.0 L 309.2 835.6 L 311.8 838.2 L 312.8 838.0 L 316.2 837.3 L 320.1 836.8 L 326.0 835.6 L 328.8 834.9 L 338.7 832.9 L 338.8 829.7 L 338.5 825.5 L 338.2 821.5 L 339.5 817.8 L 340.3 814.5 L 340.7 812.0 L 341.1 808.7 L 338.7 807.7 L 326.2 807.2 L 325.3 806.6 L 324.2 803.4 L 319.2 788.2 L 308.9 770.4 L 306.6 764.5 L 307.1 758.9 L 308.7 752.7 L 309.5 751.2 Z',
  },
];

// Villes et agglomérations majeures du Bénin
export const BENIN_CITIES: CityInfo[] = [
  // Littoral & Atlantique (Grand Nokoué)
  {
    id: 'cotonou',
    name: 'Cotonou',
    department: 'Littoral',
    population: 678874,
    coord: { lat: 6.3654, lon: 2.4183 },
    isUrbanHub: true,
    neighbourhoods: [
      'Akpakpa (Port / Dépôt Central)',
      'Ganhi (Affaires)',
      'Cadjèhoun',
      'Haie Vive',
      'Fidjrossè',
      'Gbégamey',
      'Jéricho',
      'Zogbo',
      'Agla',
      'Houéyiho',
      'Saint-Michel',
    ],
  },
  {
    id: 'calavi',
    name: 'Abomey-Calavi',
    department: 'Atlantique',
    population: 656358,
    coord: { lat: 6.4485, lon: 2.3557 },
    isUrbanHub: true,
    neighbourhoods: ['Godomey', 'Togba', 'Akassato', 'Hêvié', 'Ouèdo', 'Zinvié'],
  },
  {
    id: 'portonovo',
    name: 'Porto-Novo',
    department: 'Ouémé',
    population: 264320,
    coord: { lat: 6.4969, lon: 2.6289 },
    isUrbanHub: true,
    neighbourhoods: ['Djassin', 'Ouando', 'Attakè', 'Avakpa', 'Tokpota'],
  },
  {
    id: 'ouidah',
    name: 'Ouidah',
    department: 'Atlantique',
    population: 162034,
    coord: { lat: 6.3631, lon: 2.0851 },
    isUrbanHub: false,
  },
  {
    id: 'allada',
    name: 'Allada',
    department: 'Atlantique',
    population: 127512,
    coord: { lat: 6.6654, lon: 2.1513 },
    isUrbanHub: false,
  },

  // Zou & Collines (Centre)
  {
    id: 'bohicon',
    name: 'Bohicon',
    department: 'Zou',
    population: 171781,
    coord: { lat: 7.1783, lon: 2.0667 },
    isUrbanHub: true,
  },
  {
    id: 'abomey',
    name: 'Abomey',
    department: 'Zou',
    population: 92266,
    coord: { lat: 7.1829, lon: 1.9912 },
    isUrbanHub: false,
  },
  {
    id: 'dassa',
    name: 'Dassa-Zoumè',
    department: 'Collines',
    population: 112122,
    coord: { lat: 7.7558, lon: 2.1839 },
    isUrbanHub: false,
  },
  {
    id: 'savalou',
    name: 'Savalou',
    department: 'Collines',
    population: 144549,
    coord: { lat: 7.9281, lon: 1.9756 },
    isUrbanHub: false,
  },
  {
    id: 'save',
    name: 'Savè',
    department: 'Collines',
    population: 87179,
    coord: { lat: 8.0333, lon: 2.4833 },
    isUrbanHub: false,
  },

  // Borgou & Donga (Moyen Nord)
  {
    id: 'parakou',
    name: 'Parakou',
    department: 'Borgou',
    population: 255478,
    coord: { lat: 9.3372, lon: 2.6303 },
    isUrbanHub: true,
    neighbourhoods: ['Banikanni', 'Albarika', 'Titirou', 'Zongo', 'Guéma'],
  },
  {
    id: 'djougou',
    name: 'Djougou',
    department: 'Donga',
    population: 267812,
    coord: { lat: 9.7085, lon: 1.6660 },
    isUrbanHub: true,
  },
  {
    id: 'bembereke',
    name: 'Bembèrèkè',
    department: 'Borgou',
    population: 131255,
    coord: { lat: 10.2283, lon: 2.6636 },
    isUrbanHub: false,
  },
  {
    id: 'bassila',
    name: 'Bassila',
    department: 'Donga',
    population: 130091,
    coord: { lat: 9.0125, lon: 1.6654 },
    isUrbanHub: false,
  },

  // Atacora & Alibori (Grand Nord)
  {
    id: 'natitingou',
    name: 'Natitingou',
    department: 'Atacora',
    population: 103843,
    coord: { lat: 10.3042, lon: 1.3796 },
    isUrbanHub: true,
  },
  {
    id: 'tanguieta',
    name: 'Tanguiéta',
    department: 'Atacora',
    population: 74675,
    coord: { lat: 10.6214, lon: 1.2664 },
    isUrbanHub: false,
  },
  {
    id: 'boukoumbe',
    name: 'Boukoumbé',
    department: 'Atacora',
    population: 82494,
    coord: { lat: 10.1772, lon: 1.1075 },
    isUrbanHub: false,
  },
  {
    id: 'kandi',
    name: 'Kandi',
    department: 'Alibori',
    population: 179290,
    coord: { lat: 11.1342, lon: 2.9386 },
    isUrbanHub: true,
  },
  {
    id: 'malanville',
    name: 'Malanville',
    department: 'Alibori',
    population: 168641,
    coord: { lat: 11.8683, lon: 3.3833 },
    isUrbanHub: false,
  },
  {
    id: 'banikoara',
    name: 'Banikoara',
    department: 'Alibori',
    population: 246575,
    coord: { lat: 11.2985, lon: 2.4386 },
    isUrbanHub: false,
  },

  // Mono, Couffo, Plateau (Sud-Ouest & Sud-Est)
  {
    id: 'lokossa',
    name: 'Lokossa',
    department: 'Mono',
    population: 104961,
    coord: { lat: 6.6384, lon: 1.7167 },
    isUrbanHub: false,
  },
  {
    id: 'grandpopo',
    name: 'Grand-Popo',
    department: 'Mono',
    population: 57636,
    coord: { lat: 6.2806, lon: 1.8219 },
    isUrbanHub: false,
  },
  {
    id: 'aplahoue',
    name: 'Aplahoué',
    department: 'Couffo',
    population: 171109,
    coord: { lat: 6.9333, lon: 1.6833 },
    isUrbanHub: false,
  },
  {
    id: 'pobe',
    name: 'Pobè',
    department: 'Plateau',
    population: 123677,
    coord: { lat: 6.9806, lon: 2.6644 },
    isUrbanHub: false,
  },
  {
    id: 'sakete',
    name: 'Sakété',
    department: 'Plateau',
    population: 114088,
    coord: { lat: 6.7361, lon: 2.6586 },
    isUrbanHub: false,
  },
];

// Corridors routiers prioritaires (RNIE - Routes Nationales Inter-États)
export interface RoadCorridor {
  code: string;
  name: string;
  waypoints: GeoCoordinate[];
  type: 'backbone_highway' | 'interstate_link' | 'regional_connector';
  isPaved: boolean;
}

export const BENIN_ROAD_NETWORK: RoadCorridor[] = [
  // RNIE 2: La grande colonne vertébrale Nord-Sud (Cotonou -> Bohicon -> Parakou -> Kandi -> Malanville)
  {
    code: 'RNIE 2',
    name: 'Axe Nord-Sud (Cotonou - Parakou - Malanville)',
    type: 'backbone_highway',
    isPaved: true,
    waypoints: [
      { lat: 6.3654, lon: 2.4183 }, // Cotonou
      { lat: 6.4485, lon: 2.3557 }, // Calavi
      { lat: 6.6654, lon: 2.1513 }, // Allada
      { lat: 7.1783, lon: 2.0667 }, // Bohicon
      { lat: 7.7558, lon: 2.1839 }, // Dassa
      { lat: 9.3372, lon: 2.6303 }, // Parakou
      { lat: 10.2283, lon: 2.6636 }, // Bembèrèkè
      { lat: 11.1342, lon: 2.9386 }, // Kandi
      { lat: 11.8683, lon: 3.3833 }, // Malanville
    ],
  },
  // RNIE 1: Corridor Côtier Ouest-Est (Grand-Popo -> Ouidah -> Cotonou -> Porto-Novo -> Frontière Nigéria)
  {
    code: 'RNIE 1',
    name: 'Corridor Côtier (Grand-Popo - Cotonou - Porto-Novo - Sèmè)',
    type: 'backbone_highway',
    isPaved: true,
    waypoints: [
      { lat: 6.2806, lon: 1.8219 }, // Grand-Popo
      { lat: 6.3631, lon: 2.0851 }, // Ouidah
      { lat: 6.3654, lon: 2.4183 }, // Cotonou
      { lat: 6.4969, lon: 2.6289 }, // Porto-Novo
      { lat: 6.4250, lon: 2.7150 }, // Sèmè-Kpodji
    ],
  },
  // RNIE 3: Axe Centre-Nord-Ouest (Dassa -> Savalou -> Bassila -> Djougou -> Natitingou)
  {
    code: 'RNIE 3',
    name: 'Corridor Nord-Ouest (Dassa - Savalou - Djougou - Natitingou)',
    type: 'interstate_link',
    isPaved: true,
    waypoints: [
      { lat: 7.7558, lon: 2.1839 }, // Dassa
      { lat: 7.9281, lon: 1.9756 }, // Savalou
      { lat: 9.0125, lon: 1.6654 }, // Bassila
      { lat: 9.7085, lon: 1.6660 }, // Djougou
      { lat: 10.3042, lon: 1.3796 }, // Natitingou
      { lat: 10.6214, lon: 1.2664 }, // Tanguiéta
    ],
  },
  // Liaison Parakou - Djougou (Transversale)
  {
    code: 'RNIE 6',
    name: 'Transversale Borgou - Donga (Parakou - Djougou)',
    type: 'regional_connector',
    isPaved: true,
    waypoints: [
      { lat: 9.3372, lon: 2.6303 }, // Parakou
      { lat: 9.7085, lon: 1.6660 }, // Djougou
    ],
  },
  // Branche Piste Rurale Nord-Ouest (Tanguiéta -> Boukoumbé - Piste latéritique saisonnière)
  {
    code: 'Piste-Atacora',
    name: 'Piste Rurale Chaîne de l’Atacora (Natitingou - Boukoumbé)',
    type: 'regional_connector',
    isPaved: false,
    waypoints: [
      { lat: 10.3042, lon: 1.3796 }, // Natitingou
      { lat: 10.1772, lon: 1.1075 }, // Boukoumbé
    ],
  },
];

