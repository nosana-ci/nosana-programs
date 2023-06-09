/***
 * Types
 */

/// The `ArchitectureType` describes the type of chip architecture the node has
#[repr(u8)]
pub enum ArchitectureType {
    // https://github.com/docker-library/official-images#architectures-other-than-amd64
    Amd64 = 0,        // Linux x86-64
    Arm32v6 = 1,      // ARMv6 32-bit
    Arm32v7 = 2,      // ARMv7 32-bit
    Arm64v8 = 3,      // ARMv8 64-bit
    WindowsAmd64 = 4, // Windows x86-64
    Ppc64le = 5,      // IBM POWER8
    S390x = 6,        // IBM z Systems
    Mips64le = 7,     // MIPS64 LE
    Riscv64 = 8,      // RISC-V 64-bit
    I386 = 9,         // x86/i686
    Unknown = 255,
}

impl From<u8> for ArchitectureType {
    fn from(architecture_type: u8) -> Self {
        match architecture_type {
            0 => ArchitectureType::Amd64,
            1 => ArchitectureType::Arm32v6,
            2 => ArchitectureType::Arm32v7,
            3 => ArchitectureType::Arm64v8,
            4 => ArchitectureType::WindowsAmd64,
            5 => ArchitectureType::Ppc64le,
            6 => ArchitectureType::S390x,
            7 => ArchitectureType::Mips64le,
            8 => ArchitectureType::Riscv64,
            9 => ArchitectureType::I386,
            _ => ArchitectureType::Unknown,
        }
    }
}

/// The `CountryCode` represent the ISO code for a country
#[repr(u8)]
pub enum CountryCode {
    // https://www.iban.com/country-codes
    AF = 0,   // Afghanistan
    AL = 1,   // Albania
    DZ = 2,   // Algeria
    AS = 3,   // American Samoa
    AD = 4,   // Andorra
    AO = 5,   // Angola
    AI = 6,   // Anguilla
    AQ = 7,   // Antarctica
    AG = 8,   // Antigua and Barbuda
    AR = 9,   // Argentina
    AM = 10,  // Armenia
    AW = 11,  // Aruba
    AU = 12,  // Australia
    AT = 13,  // Austria
    AZ = 14,  // Azerbaijan
    BS = 15,  // Bahamas (the)
    BH = 16,  // Bahrain
    BD = 17,  // Bangladesh
    BB = 18,  // Barbados
    BY = 19,  // Belarus
    BE = 20,  // Belgium
    BZ = 21,  // Belize
    BJ = 22,  // Benin
    BM = 23,  // Bermuda
    BT = 24,  // Bhutan
    BO = 25,  // Bolivia (Plurinational State of)
    BQ = 26,  // Bonaire, Sint Eustatius and Saba
    BA = 27,  // Bosnia and Herzegovina
    BW = 28,  // Botswana
    BV = 29,  // Bouvet Island
    BR = 30,  // Brazil
    IO = 31,  // British Indian Ocean Territory (the)
    BN = 32,  // Brunei Darussalam
    BG = 33,  // Bulgaria
    BF = 34,  // Burkina Faso
    BI = 35,  // Burundi
    CV = 36,  // Cabo Verde
    KH = 37,  // Cambodia
    CM = 38,  // Cameroon
    CA = 39,  // Canada
    KY = 40,  // Cayman Islands (the)
    CF = 41,  // Central African Republic (the)
    TD = 42,  // Chad
    CL = 43,  // Chile
    CN = 44,  // China
    CX = 45,  // Christmas Island
    CC = 46,  // Cocos (Keeling) Islands (the)
    CO = 47,  // Colombia
    KM = 48,  // Comoros (the)
    CD = 49,  // Congo (the Democratic Republic of the)
    CG = 50,  // Congo (the)
    CK = 51,  // Cook Islands (the)
    CR = 52,  // Costa Rica
    HR = 53,  // Croatia
    CU = 54,  // Cuba
    CW = 55,  // Curaçao
    CY = 56,  // Cyprus
    CZ = 57,  // Czechia
    CI = 58,  // Côte d'Ivoire
    DK = 59,  // Denmark
    DJ = 60,  // Djibouti
    DM = 61,  // Dominica
    DO = 62,  // Dominican Republic (the)
    EC = 63,  // Ecuador
    EG = 64,  // Egypt
    SV = 65,  // El Salvador
    GQ = 66,  // Equatorial Guinea
    ER = 67,  // Eritrea
    EE = 68,  // Estonia
    SZ = 69,  // Eswatini
    ET = 70,  // Ethiopia
    FK = 71,  // Falkland Islands (the) [Malvinas]
    FO = 72,  // Faroe Islands (the)
    FJ = 73,  // Fiji
    FI = 74,  // Finland
    FR = 75,  // France
    GF = 76,  // French Guiana
    PF = 77,  // French Polynesia
    TF = 78,  // French Southern Territories (the)
    GA = 79,  // Gabon
    GM = 80,  // Gambia (the)
    GE = 81,  // Georgia
    DE = 82,  // Germany
    GH = 83,  // Ghana
    GI = 84,  // Gibraltar
    GR = 85,  // Greece
    GL = 86,  // Greenland
    GD = 87,  // Grenada
    GP = 88,  // Guadeloupe
    GU = 89,  // Guam
    GT = 90,  // Guatemala
    GG = 91,  // Guernsey
    GN = 92,  // Guinea
    GW = 93,  // Guinea-Bissau
    GY = 94,  // Guyana
    HT = 95,  // Haiti
    HM = 96,  // Heard Island and McDonald Islands
    VA = 97,  // Holy See (the)
    HN = 98,  // Honduras
    HK = 99,  // Hong Kong
    HU = 100, // Hungary
    IS = 101, // Iceland
    IN = 102, // India
    ID = 103, // Indonesia
    IR = 104, // Iran (Islamic Republic of)
    IQ = 105, // Iraq
    IE = 106, // Ireland
    IM = 107, // Isle of Man
    IL = 108, // Israel
    IT = 109, // Italy
    JM = 110, // Jamaica
    JP = 111, // Japan
    JE = 112, // Jersey
    JO = 113, // Jordan
    KZ = 114, // Kazakhstan
    KE = 115, // Kenya
    KI = 116, // Kiribati
    KP = 117, // Korea (the Democratic People's Republic of)
    KR = 118, // Korea (the Republic of)
    KW = 119, // Kuwait
    KG = 120, // Kyrgyzstan
    LA = 121, // Lao People's Democratic Republic (the)
    LV = 122, // Latvia
    LB = 123, // Lebanon
    LS = 124, // Lesotho
    LR = 125, // Liberia
    LY = 126, // Libya
    LI = 127, // Liechtenstein
    LT = 128, // Lithuania
    LU = 129, // Luxembourg
    MO = 130, // Macao
    MG = 131, // Madagascar
    MW = 132, // Malawi
    MY = 133, // Malaysia
    MV = 134, // Maldives
    ML = 135, // Mali
    MT = 136, // Malta
    MH = 137, // Marshall Islands (the)
    MQ = 138, // Martinique
    MR = 139, // Mauritania
    MU = 140, // Mauritius
    YT = 141, // Mayotte
    MX = 142, // Mexico
    FM = 143, // Micronesia (Federated States of)
    MD = 144, // Moldova (the Republic of)
    MC = 145, // Monaco
    MN = 146, // Mongolia
    ME = 147, // Montenegro
    MS = 148, // Montserrat
    MA = 149, // Morocco
    MZ = 150, // Mozambique
    MM = 151, // Myanmar
    NA = 152, // Namibia
    NR = 153, // Nauru
    NP = 154, // Nepal
    NL = 155, // Netherlands (the)
    NC = 156, // New Caledonia
    NZ = 157, // New Zealand
    NI = 158, // Nicaragua
    NE = 159, // Niger (the)
    NG = 160, // Nigeria
    NU = 161, // Niue
    NF = 162, // Norfolk Island
    MP = 163, // Northern Mariana Islands (the)
    NO = 164, // Norway
    OM = 165, // Oman
    PK = 166, // Pakistan
    PW = 167, // Palau
    PS = 168, // Palestine, State of
    PA = 169, // Panama
    PG = 170, // Papua New Guinea
    PY = 171, // Paraguay
    PE = 172, // Peru
    PH = 173, // Philippines (the)
    PN = 174, // Pitcairn
    PL = 175, // Poland
    PT = 176, // Portugal
    PR = 177, // Puerto Rico
    QA = 178, // Qatar
    MK = 179, // Republic of North Macedonia
    RO = 180, // Romania
    RU = 181, // Russian Federation (the)
    RW = 182, // Rwanda
    RE = 183, // Réunion
    BL = 184, // Saint Barthélemy
    SH = 185, // Saint Helena, Ascension and Tristan da Cunha
    KN = 186, // Saint Kitts and Nevis
    LC = 187, // Saint Lucia
    MF = 188, // Saint Martin (French part)
    PM = 189, // Saint Pierre and Miquelon
    VC = 190, // Saint Vincent and the Grenadines
    WS = 191, // Samoa
    SM = 192, // San Marino
    ST = 193, // Sao Tome and Principe
    SA = 194, // Saudi Arabia
    SN = 195, // Senegal
    RS = 196, // Serbia
    SC = 197, // Seychelles
    SL = 198, // Sierra Leone
    SG = 199, // Singapore
    SX = 200, // Sint Maarten (Dutch part)
    SK = 201, // Slovakia
    SI = 202, // Slovenia
    SB = 203, // Solomon Islands
    SO = 204, // Somalia
    ZA = 205, // South Africa
    GS = 206, // South Georgia and the South Sandwich Islands
    SS = 207, // South Sudan
    ES = 208, // Spain
    LK = 209, // Sri Lanka
    SD = 210, // Sudan (the)
    SR = 211, // Suriname
    SJ = 212, // Svalbard and Jan Mayen
    SE = 213, // Sweden
    CH = 214, // Switzerland
    SY = 215, // Syrian Arab Republic
    TW = 216, // Taiwan (Province of China)
    TJ = 217, // Tajikistan
    TZ = 218, // Tanzania, United Republic of
    TH = 219, // Thailand
    TL = 220, // Timor-Leste
    TG = 221, // Togo
    TK = 222, // Tokelau
    TO = 223, // Tonga
    TT = 224, // Trinidad and Tobago
    TN = 225, // Tunisia
    TR = 226, // Turkey
    TM = 227, // Turkmenistan
    TC = 228, // Turks and Caicos Islands (the)
    TV = 229, // Tuvalu
    UG = 230, // Uganda
    UA = 231, // Ukraine
    AE = 232, // United Arab Emirates (the)
    GB = 233, // United Kingdom of Great Britain and Northern Ireland (the)
    UM = 234, // United States Minor Outlying Islands (the)
    US = 235, // United States of America (the)
    UY = 236, // Uruguay
    UZ = 237, // Uzbekistan
    VU = 238, // Vanuatu
    VE = 239, // Venezuela (Bolivarian Republic of)
    VN = 240, // Viet Nam
    VG = 241, // Virgin Islands (British)
    VI = 242, // Virgin Islands (U.S.)
    WF = 243, // Wallis and Futuna
    EH = 244, // Western Sahara
    YE = 245, // Yemen
    ZM = 246, // Zambia
    ZW = 247, // Zimbabwe
    AX = 248, // Åland Islands
    Known = 254,
    Unknown = 255,
}

impl From<u8> for CountryCode {
    fn from(country_code: u8) -> Self {
        match country_code {
            0..=248 => CountryCode::Known,
            _ => CountryCode::Unknown,
        }
    }
}
