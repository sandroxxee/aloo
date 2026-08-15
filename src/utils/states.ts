// Brazilian States / UF metadata and DDD mappings

export interface StateInfo {
  uf: string;
  name: string;
  region: 'Sudeste' | 'Sul' | 'Centro-Oeste' | 'Nordeste' | 'Norte';
  ddds: string[];
  majorCities?: string[];
}

export const BRAZIL_STATES: StateInfo[] = [
  { 
    uf: 'SP', 
    name: 'São Paulo', 
    region: 'Sudeste', 
    ddds: ['11', '12', '13', '14', '15', '16', '17', '18', '19'], 
    majorCities: [
      'São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'São José dos Campos', 'Osasco', 'Ribeirão Preto', 'Sorocaba', 'Mauá', 'São José do Rio Preto', 'Mogi das Cruzes', 'Santos', 'Diadema', 'Jundiaí', 'Piracicaba', 'Carapicuíba', 'Bauru', 'Itaquaquecetuba', 'São Vicente', 'Franca', 'Praia Grande', 'Guarujá', 'Taubaté', 'Limeira', 'Suzuano', 'Taboão da Serra', 'Sumaré', 'Barueri', 'Embu das Artes', 'Indaiatuba', 'Cotia', 'Americana', 'Marília', 'Itapevi', 'Araraquara', 'Jacareí', 'Hortolândia', 'Presidente Prudente', 'Rio Claro', 'Araçatuba', 'Ferraz de Vasconcelos', 'Santa Bárbara d\'Oeste', 'Francisco Morato', 'Itapecerica da Serra', 'Itu', 'Bragança Paulista', 'Pindamonhangaba', 'São Carlos', 'Atibaia'
    ] 
  },
  { 
    uf: 'MG', 
    name: 'Minas Gerais', 
    region: 'Sudeste', 
    ddds: ['31', '32', '33', '34', '35', '37', '38'], 
    majorCities: [
      'Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga', 'Sete Lagoas', 'Divinópolis', 'Santa Luzia', 'Ibirité', 'Poços de Caldas', 'Patos de Minas', 'Pouso Alegre', 'Teófilo Otoni', 'Barbacena', 'Sabará', 'Varginha', 'Conselheiro Lafaiete', 'Vespasiano', 'Itabira', 'Araguari', 'Uba', 'Passos', 'Coronel Fabriciano', 'Muriaé', 'Itajubá', 'Nova Lima', 'Araxá', 'Lavras', 'Itaúna', 'Pará de Minas', 'Paracatu', 'Caratinga', 'Nova Serrana', 'São João del-Rei', 'Patrocínio', 'Timóteo', 'Manhuaçu', 'Unaí', 'Curvelo', 'Alfenas', 'João Monlevade', 'Três Corações', 'Viçosa', 'Cataguases', 'Janaúba'
    ] 
  },
  { 
    uf: 'RJ', 
    name: 'Rio de Janeiro', 
    region: 'Sudeste', 
    ddds: ['21', '22', '24'], 
    majorCities: [
      'Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Belford Roxo', 'Campos dos Goytacazes', 'São João de Meriti', 'Petrópolis', 'Volta Redonda', 'Macaé', 'Magé', 'Itaboraí', 'Cabo Frio', 'Angra dos Reis', 'Nova Friburgo', 'Teresópolis', 'Mesquita', 'Barra Mansa', 'Maricá', 'Nilópolis', 'Araruama', 'Resende', 'São Pedro da Aldeia', 'Itaguaí', 'Japeri', 'Queimados', 'Saquarema', 'Campos Elíseos', 'Três Rios', 'Valença', 'Itaperuna', 'Barra do Piraí', 'Rio das Ostras', 'Santo Antônio de Pádua', 'Seropédica', 'Paracambi', 'Cachoeiras de Macacu', 'Paraíba do Sul', 'Guapimirim', 'Mangaratiba', 'Casimiro de Abreu', 'Paraty', 'São Fidélis', 'Piraí', 'Búzios', 'Bom Jesus do Itabapoana', 'São Francisco de Itabapoana', 'Cantagalo', 'Vassouras'
    ] 
  },
  { 
    uf: 'ES', 
    name: 'Espírito Santo', 
    region: 'Sudeste', 
    ddds: ['27', '28'], 
    majorCities: [
      'Serra', 'Vila Velha', 'Cariacica', 'Vitória', 'Cachoeiro de Itapemirim', 'Linhares', 'São Mateus', 'Guarapari', 'Colatina', 'Aracruz', 'Viana', 'Nova Venécia', 'Barra de São Francisco', 'Marataízes', 'Santa Maria de Jetibá', 'Castelo', 'São Gabriel da Palha', 'Domingos Martins', 'Itapemirim', 'Anchieta', 'Afonso Cláudio', 'Alegre', 'Baixo Guandu', 'Conceição da Barra', 'Iúna', 'Guaçuí', 'Sooretama', 'Jaguaré', 'Pinheiros', 'Pedro Canário', 'Iconha', 'Venda Nova do Imigrante', 'Ibatiba', 'Montanha', 'Mimoso do Sul', 'Presidente Kennedy', 'Muniz Freire', 'Vargem Alta', 'Pancas', 'Rio Bananal', 'Laranja da Terra', 'Ecoporanga', 'Fundão', 'Mantenópolis', 'Itaguaçu', 'Marechal Floriano', 'Muqui', 'Atílio Vivácqua', 'Ibiraçu', 'Apiacá'
    ] 
  },
  { 
    uf: 'PR', 
    name: 'Paraná', 
    region: 'Sul', 
    ddds: ['41', '42', '43', '44', '45', '46'], 
    majorCities: [
      'Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá', 'Araucária', 'Toledo', 'Apucarana', 'Campo Largo', 'Pinhais', 'Umuarama', 'Arapongas', 'Almirante Tamandaré', 'Campo Mourão', 'Piraquara', 'Cambé', 'Fazenda Rio Grande', 'Sarandi', 'Paranavaí', 'Francisco Beltrão', 'Pato Branco', 'Cianorte', 'Telêmaco Borba', 'Castro', 'Rolândia', 'Irati', 'União da Vitória', 'Ibiporã', 'Prudentópolis', 'Marechal Cândido Rondon', 'Cornélio Procópio', 'Medianeira', 'Lapa', 'Palmas', 'Paiçandu', 'São Mateus do Sul', 'Jacarezinho', 'Marmeleiro', 'Jaguariaíva', 'Guaratuba', 'Matinhos', 'Santo Antônio da Platina', 'Mandaguari', 'Quedas do Iguaçu', 'Dois Vizinhos'
    ] 
  },
  { 
    uf: 'SC', 
    name: 'Santa Catarina', 
    region: 'Sul', 
    ddds: ['47', '48', '49'], 
    majorCities: [
      'Joinville', 'Florianópolis', 'Blumenau', 'São José', 'Chapecó', 'Itajaí', 'Criciúma', 'Jaraguá do Sul', 'Palhoça', 'Lages', 'Balneário Camboriú', 'Brusque', 'Tubarão', 'São Bento do Sul', 'Camboriú', 'Navegantes', 'Caçador', 'Concórdia', 'Rio do Sul', 'Araranguá', 'Indaial', 'Gaspar', 'Biguaçu', 'Itapema', 'Içara', 'Videira', 'Mafra', 'Canoinhas', 'Xanxerê', 'Timbó', 'São Francisco do Sul', 'Sombrio', 'Guaramirim', 'Laguna', 'Imbituba', 'Orleans', 'Curitibanos', 'São Miguel do Oeste', 'Fraiburgo', 'Penha', 'Porto Belo', 'Bombinhas', 'Araquari', 'Barra Velha', 'Campos Novos', 'Capivari de Baixo', 'Maravilha', 'Tijucas', 'Pomerode', 'Joaçaba'
    ] 
  },
  { 
    uf: 'RS', 
    name: 'Rio Grande do Sul', 
    region: 'Sul', 
    ddds: ['51', '53', '54', '55'], 
    majorCities: [
      'Porto Alegre', 'Caxias do Sul', 'Canoas', 'Pelotas', 'Santa Maria', 'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande', 'Alvorada', 'Passo Fundo', 'Sapucaia do Sul', 'Santa Cruz do Sul', 'Uruguaiana', 'Bento Gonçalves', 'Bagé', 'Erechim', 'Guaíba', 'Lajeado', 'Ijuí', 'Cachoeirinha', 'Esteio', 'Sant\'Ana do Livramento', 'Cachoeira do Sul', 'Sapiranga', 'Santa Rosa', 'Farroupilha', 'Venâncio Aires', 'Vacaria', 'Campo Bom', 'Cruz Alta', 'Montenegro', 'São Borja', 'Carazinho', 'Taquara', 'Camaquã', 'Parobé', 'São Gabriel', 'Tramandaí', 'Santo Ângelo', 'Capão da Canoa', 'Gramado', 'Canela', 'Encantado', 'Osório', 'Marau', 'Torres', 'São Luiz Gonzaga'
    ] 
  },
  { 
    uf: 'GO', 
    name: 'Goiás', 
    region: 'Centro-Oeste', 
    ddds: ['62', '64'], 
    majorCities: [
      'Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia', 'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Formosa', 'Senador Canedo', 'Itumbiara', 'Catalão', 'Jataí', 'Planaltina', 'Caldas Novas', 'Santo Antônio do Descoberto', 'Goianésia', 'Cidade Ocidental', 'Inhumas', 'Cristalina', 'Mineiros', 'Novo Gama', 'Niquelândia', 'Morrinhos', 'Jaraguá', 'Quirinópolis', 'Santa Helena de Goiás', 'Porangatu', 'Goiatuba', 'Uruaçu', 'São Luís de Montes Belos', 'Iporá', 'Posse', 'Pires do Rio', 'Minaçu', 'Padre Bernardo', 'Bela Vista de Goiás', 'Palmeiras de Goiás', 'Ipameri', 'Alexânia', 'Piracanjuba', 'Itaberaí', 'Pirenópolis', 'Mozarlândia', 'Goianira', 'Rubiataba', 'Anicuns', 'Silvânia'
    ] 
  },
  { 
    uf: 'DF', 
    name: 'Distrito Federal', 
    region: 'Centro-Oeste', 
    ddds: ['61'], 
    majorCities: [
      'Brasília', 'Ceilândia', 'Samambaia', 'Taguatinga', 'Plano Piloto', 'Planaltina', 'Gama', 'Guará', 'Santa Maria', 'Recanto das Emas', 'São Sebastião', 'Vicente Pires', 'Águas Claras', 'Riacho Fundo', 'Sobradinho', 'Cruzeiro', 'Sudoeste/Octogonal', 'Lago Norte', 'Lago Sul', 'Núcleo Bandeirante', 'Candangolândia', 'Brazlândia', 'Paranoá', 'Itapoã', 'SCIA/Estrutural', 'SIA', 'Park Way', 'Varjão', 'Fercal', 'Sol Nascente/Pôr do Sol'
    ] 
  },
  { 
    uf: 'MT', 
    name: 'Mato Grosso', 
    region: 'Centro-Oeste', 
    ddds: ['65', '66'], 
    majorCities: [
      'Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra', 'Sorriso', 'Barra do Garças', 'Primavera do Leste', 'Lucas do Rio Verde', 'Alta Floresta', 'Pontes e Lacerda', 'Nova Mutum', 'Juína', 'Campo Verde', 'Juara', 'Peixoto de Azevedo', 'Barra do Bugres', 'Colniza', 'Poconé', 'Guarantã do Norte', 'Confresa', 'Água Boa', 'Cáceres', 'Campo Novo do Parecis', 'Diamantino', 'Jaciara', 'Mirassol d\'Oeste', 'Sapezal', 'Vila Rica', 'Paranaíta', 'Pedra Preta', 'Nova Xavantina', 'Canarana', 'Comodoro', 'Marcelândia', 'Querência', 'São José do Rio Claro', 'Araputanga', 'Nossa Senhora do Livramento', 'Chapadão do Sul', 'Aripuanã', 'Nova Olimpia', 'Alto Araguaia', 'Rosário Oeste', 'Vila Bela da Santíssima Trindade', 'Cotriguaçu', 'Tapurah', 'Porto Alegre do Norte', 'Matupá', 'Apiacás'
    ] 
  },
  { 
    uf: 'MS', 
    name: 'Mato Grosso do Sul', 
    region: 'Centro-Oeste', 
    ddds: ['67'], 
    majorCities: [
      'Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã', 'Sidrolândia', 'Naviraí', 'Nova Andradina', 'Aquidauana', 'Maracaju', 'Paranaíba', 'Amambai', 'Rio Brilhante', 'Coxim', 'Caarapó', 'Miranda', 'São Gabriel do Oeste', 'Jardim', 'Aparecida do Taboado', 'Chapadão do Sul', 'Anastácio', 'Ribas do Rio Pardo', 'Itaporã', 'Bela Vista', 'Ivinhema', 'Ladário', 'Bataguassu', 'Cassilândia', 'Bonito', 'Terenos', 'Nova Alvorada do Sul', 'Costa Rica', 'Fatima do Sul', 'Mundo Novo', 'Sonora', 'Iguatemi', 'Nioaque', 'Guia Lopes da Laguna', 'Rio Verde de Mato Grosso', 'Porto Murtinho', 'Anaurilândia', 'Glória de Dourados', 'Coronel Sapucaia', 'Sete Quedas', 'Batayporã', 'Tacuru', 'Brasilândia', 'Eldorado', 'Angélica'
    ] 
  },
  { 
    uf: 'BA', 
    name: 'Bahia', 
    region: 'Nordeste', 
    ddds: ['71', '73', '74', '75', '77'], 
    majorCities: [
      'Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro', 'Lauro de Freitas', 'Itabuna', 'Ilhéus', 'Porto Seguro', 'Barreiras', 'Jequié', 'Alagoinhas', 'Teixeira de Freitas', 'Eunápolis', 'Paulo Afonso', 'Santo Antônio de Jesus', 'Valença', 'Candeias', 'Guanambi', 'Jacobina', 'Luís Eduardo Magalhães', 'Serrinha', 'Senhor do Bonfim', 'Dias d\'Ávila', 'Itapetinga', 'Irecê', 'Campo Formoso', 'Casa Nova', 'Bom Jesus da Lapa', 'Brumado', 'Conceição do Coité', 'Itamaraju', 'Itaberaba', 'Cruz das Almas', 'Ipirá', 'Santo Amaro', 'Euclides da Cunha', 'Tucano', 'Araci', 'Catu', 'Jaguaquara', 'Barra', 'Macaúbas', 'Santo Estêvão', 'Caetité', 'Ribeira do Pombal', 'Cipó', 'Poções', 'Xique-Xique', 'Seabra'
    ] 
  },
  { 
    uf: 'PE', 
    name: 'Pernambuco', 
    region: 'Nordeste', 
    ddds: ['81', '87'], 
    majorCities: [
      'Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina', 'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns', 'Vitória de Santo Antão', 'Igarassu', 'São Lourenço da Mata', 'Santa Cruz do Capibaribe', 'Abreu e Lima', 'Ipojuca', 'Serra Talhada', 'Araripina', 'Gravatá', 'Carpina', 'Goiana', 'Belo Jardim', 'Arcoverde', 'Ouricuri', 'Escada', 'Pesqueira', 'Surubim', 'Palmares', 'Bezerros', 'Moreno', 'São Caitano', 'Lajedo', 'Salgueiro', 'Timbaúba', 'Toritama', 'Buíque', 'Limoeiro', 'Paudalho', 'São José do Egito', 'Sirinhaém', 'Bom Conselho', 'Barreiros', 'Ibimirim', 'Gameleira', 'Custódia', 'Cabrobó', 'Afogados da Ingazeira', 'Passira', 'Pombos', 'Águas Belas'
    ] 
  },
  { 
    uf: 'CE', 
    name: 'Ceará', 
    region: 'Nordeste', 
    ddds: ['85', '88'], 
    majorCities: [
      'Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral', 'Crato', 'Itapipoca', 'Maranguape', 'Iguatu', 'Quixadá', 'Pacatuba', 'Aquiraz', 'Quixeramobim', 'Russas', 'Canindé', 'Tianguá', 'Crateús', 'Aracati', 'Cascavel', 'Pacajus', 'Icó', 'Camocim', 'Horizonte', 'Morada Nova', 'Acaraú', 'Viçosa do Ceará', 'Barbalha', 'Limoeiro do Norte', 'Tauá', 'Trairi', 'Granja', 'Boa Viagem', 'Brejo Santo', 'Eusébio', 'Mauriti', 'Santa Quitéria', 'Pedra Branca', 'Beberibe', 'São Benedito', 'Mombaça', 'Várzea Alegre', 'Ipu', 'Itaitinga', 'Baturité', 'Missão Velha', 'Massapê', 'Jaguaribe', 'Pensamento', 'Pentecoste', 'Campos Sales'
    ] 
  },
  { 
    uf: 'MA', 
    name: 'Maranhão', 
    region: 'Nordeste', 
    ddds: ['98', '99'], 
    majorCities: [
      'São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias', 'Codó', 'Paço do Lumiar', 'Açailândia', 'Bacabal', 'Balsas', 'Santa Inês', 'Barra do Corda', 'Pinheiro', 'Chapadinha', 'Santa Luzia', 'Buriticupu', 'Grajaú', 'Itapecuru Mirim', 'Coroatá', 'Tutóia', 'Vargem Grande', 'Zé Doca', 'Viana', 'Presidente Dutra', 'Coelho Neto', 'Araioses', 'São Bento', 'Estreito', 'Pedreiras', 'Sítio Novo', 'Colinas', 'Aramari', 'Lago da Pedra', 'Porto Franco', 'Brejo', 'Icatu', 'Tuntum', 'Santa Helena', 'Rosário', 'Carolina', 'Bom Jardim', 'Amararante do Maranhão', 'Parnarama', 'São Mateus do Maranhão', 'Vitorino Freire', 'Cururupu', 'Carutapera', 'Cantanhede'
    ] 
  },
  { 
    uf: 'PB', 
    name: 'Paraíba', 
    region: 'Nordeste', 
    ddds: ['83'], 
    majorCities: [
      'João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux', 'Sousa', 'Cajazeiras', 'Cabedelo', 'Guarabira', 'Mamanguape', 'Queimadas', 'São Bento', 'Monteiro', 'Esperança', 'Pombal', 'Catolé do Rocha', 'Alagoa Grande', 'Pedras de Fogo', 'Lagoa Seca', 'Solânea', 'Itabaiana', 'Rio Tinto', 'Ingá', 'Conceição', 'Itaporanga', 'Cuité', 'Prata', 'Bananeiras', 'Areia', 'Soledade', 'Conde', 'Sumé', 'Princesa Isabel', 'Teixeira', 'Remígio', 'Picuí', 'Aroeiras', 'Mari', 'Boqueirão', 'Taperoá', 'São José de Piranhas', 'Mogeiro', 'Sapé', 'Brejo do Cruz', 'Araçagi', 'Caaporã', 'Piancó', 'Arara', 'Serra Branca', 'Borborema'
    ] 
  },
  { 
    uf: 'RN', 
    name: 'Rio Grande do Norte', 
    region: 'Nordeste', 
    ddds: ['84'], 
    majorCities: [
      'Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba', 'Ceará-Mirim', 'Caicó', 'Açu', 'Currais Novos', 'São José de Mipibu', 'Nova Cruz', 'Apodi', 'Santa Cruz', 'Touros', 'João Câmara', 'Pau dos Ferros', 'Macau', 'Canguaretama', 'Extremoz', 'Baraúna', 'Nísia Floresta', 'Goianinha', 'Santo Antônio', 'Arez', 'Alexandria', 'Ielmo Marinho', 'Angicos', 'Parelhas', 'Lajes', 'Caraúbas', 'São Paulo do Potengi', 'Monte Alegre', 'Jucurutu', 'Tangará', 'Upapanema', 'São Miguel', 'Tenente Ananias', 'São Tomé', 'Passa e Fica', 'Pedro Velho', 'Tibau do Sul', 'Guamaré', 'Afonso Bezerra', 'Ouro Branco', 'Pendências', 'Campo Redondo'
    ] 
  },
  { 
    uf: 'AL', 
    name: 'Alagoas', 
    region: 'Nordeste', 
    ddds: ['82'], 
    majorCities: [
      'Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios', 'União dos Palmares', 'Penedo', 'São Miguel dos Campos', 'Campo Alegre', 'Coruripe', 'Delmiro Gouveia', 'Marechal Deodoro', 'Santana do Ipanema', 'Atalaia', 'Teotônio Vilela', 'Girau do Ponciano', 'Pilar', 'São Luís do Quitunde', 'Maragogi', 'São Sebastião', 'Ibateguara', 'Porto Calvo', 'Capela', 'Craíbas', 'Viçosa', 'Batalha', 'Pão de Açúcar', 'Mata Grande', 'Anadia', 'Igaci', 'Olho d\'Água das Flores', 'Murici', 'Junqueiro', 'Feira Grande', 'Piranhas', 'Porto Real do Colégio', 'Major Izidoro', 'Santana do Mundaú', 'Piaçabuçu', 'Maribondo', 'Limoeiro de Anadia', 'Messias', 'Cacimbinhas', 'Coité do Nóia', 'Traipu', 'Água Branca', 'Barra de Santo Antônio', 'Paripueira', 'Colônia Leopoldina', 'Japaratinga'
    ] 
  },
  { 
    uf: 'SE', 
    name: 'Sergipe', 
    region: 'Nordeste', 
    ddds: ['79'], 
    majorCities: [
      'Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão', 'Estância', 'Tobias Barreto', 'Simão Dias', 'Itabaianinha', 'Nossa Senhora da Glória', 'Poço Redondo', 'Propriá', 'Capela', 'Itaporanga d\'Ajuda', 'Laranjeiras', 'Boquim', 'Porto da Folha', 'Umbaúba', 'Nossa Senhora das Dores', 'Neópolis', 'Canindé de São Francisco', 'Poço Verde', 'Maruim', 'Japaratuba', 'Carmópolis', 'Barra dos Coqueiros', 'Riachão do Dantas', 'Gararu', 'Arauá', 'Aquidabã', 'Pedrinhas', 'Santo Amaro das Brotas', 'Moita Bonita', 'Monte Alegre de Sergipe', 'Areia Branca', 'Pacatuba', 'Carira', 'Malhador', 'São Domingos', 'Siriri', 'Salgado', 'Nossa Senhora Aparecida', 'Campo do Brito', 'Gracho Cardoso', 'Macambira', 'Santa Luzia do Itanhy', 'Indiaroba', 'Piratambu', 'Ilha das Flores', 'Cristinápolis'
    ] 
  },
  { 
    uf: 'PI', 
    name: 'Piauí', 
    region: 'Nordeste', 
    ddds: ['86', '89'], 
    majorCities: [
      'Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano', 'Campo Maior', 'Barras', 'Union', 'Altos', 'Esperantina', 'José de Freitas', 'Pedro II', 'Oeiras', 'São Raimundo Nonato', 'Miguel Alves', 'Luís Correia', 'Piracuruca', 'Cocal', 'Batalha', 'Corrente', 'Luzilândia', 'Bom Jesus', 'Amarante', 'Uruçuí', 'Valença do Piauí', 'Água Branca', 'Paulistana', 'Canto do Buriti', 'Castelo do Piauí', 'Jaicós', 'Manoel Emídio', 'Simplício Mendes', 'São João do Piauí', 'Anísio de Abreu', 'Elesbão Veloso', 'Buriti dos Lopes', 'Joaquim Pires', 'Palmeirais', 'Porto', 'São Pedro do Piauí', 'Matias Olímpio', 'Gilbués', 'Pio IX', 'Itaueira', 'Simões', 'Fronteiras', 'Regeneração', 'Curimatá'
    ] 
  },
  { 
    uf: 'PA', 
    name: 'Pará', 
    region: 'Norte', 
    ddds: ['91', '93', '94'], 
    majorCities: [
      'Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas', 'Castanhal', 'Abaetetuba', 'Cametá', 'Marituba', 'Bragança', 'São Félix do Xingu', 'Barcarena', 'Altamira', 'Tucuruí', 'Paragominas', 'Tailândia', 'Breves', 'Capanema', 'Redenção', 'Itaituba', 'Santa Izabel do Pará', 'Igarapé-Miri', 'Tomé-Açu', 'Benevides', 'Portel', 'Ipixuna do Pará', 'Oriximiná', 'Salinópolis', 'Dom Eliseu', 'Vigia', 'Rondon do Pará', 'Capitão Poço', 'Maju', 'Conceição do Araguaia', 'Jacundá', 'Obidos', 'Goianésia do Pará', 'Santana do Araguaia', 'Ulianópolis', 'Alenquer', 'Monte Alegre', 'Acará', 'Xinguara', 'Itupiranga', 'São Miguel do Guamá', 'Moju', 'Ourilândia do Norte', 'Augusto Corrêa', 'Curuçá', 'Muaná'
    ] 
  },
  { 
    uf: 'AM', 
    name: 'Amazonas', 
    region: 'Norte', 
    ddds: ['92', '97'], 
    majorCities: [
      'Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari', 'Tabatinga', 'Maués', 'Tefé', 'Humaitá', 'Iranduba', 'Lábrea', 'São Gabriel da Cachoeira', 'Benjamin Constant', 'Borba', 'Autazes', 'Manicoré', 'Careiro', 'Presidente Figueiredo', 'Santo Antônio do Içá', 'Eirunepé', 'Barreirinha', 'Nova Olinda do Norte', 'Boca do Acre', 'Carauari', 'Barcelos', 'Codajás', 'Rio Preto da Eva', 'Santa Isabel do Rio Negro', 'Fonte Boa', 'Ipixuna', 'Urucurituba', 'Nhamundá', 'Maraã', 'Apuí', 'Canutama', 'Novo Aripuanã', 'Envira', 'Beruri', 'Tonantins', 'Atalaia do Norte', 'Tapauá', 'Uarini', 'São Paulo de Olivença', 'Jutaí', 'Guajará', 'Anori', 'Pauini', 'Caapiranga', 'Novo Airão'
    ] 
  },
  { 
    uf: 'RO', 
    name: 'Rondônia', 
    region: 'Norte', 
    ddds: ['69'], 
    majorCities: [
      'Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal', 'Rolim de Moura', 'Jaru', 'Guajará-Mirim', 'Ouro Preto do Oeste', 'Pimenta Bueno', 'Buritis', 'Machadinho d\'Oeste', 'Espigão d\'Oeste', 'Alta Floresta d\'Oeste', 'Candeias do Jamari', 'São Miguel do Guaporé', 'Nova Mamoré', 'Colorado do Oeste', 'Alto Paraíso', 'Presidente Médici', 'Cujubim', 'Aliquemes', 'Seringueiras', 'Costa Marques', 'Monte Negro', 'Nova Brasilândia d\'Oeste', 'Chupinguaia', 'Urupá', 'Alto Alegre dos Parecis', 'Alvorada d\'Oeste', 'Corumbiara', 'Ministro Andreazza', 'Mirante da Serra', 'Itapuã do Oeste', 'Governador Jorge Teixeira', 'Santa Luzia d\'Oeste', 'Novo Horizonte do Oeste', 'Cabixi', 'Vale do Anari', 'Parecis', 'Cacaulândia', 'Teixeirópolis', 'São Felipe d\'Oeste', 'Rio Crespo', 'Castanheiras', 'Primavera de Rondônia', 'Pimenteiras do Oeste'
    ] 
  },
  { 
    uf: 'TO', 
    name: 'Tocantins', 
    region: 'Norte', 
    ddds: ['63'], 
    majorCities: [
      'Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins', 'Araguatins', 'Colinas do Tocantins', 'Guaraí', 'Tocantinópolis', 'Dianópolis', 'Formoso do Araguaia', 'Miracema do Tocantins', 'Taguatinga', 'Pedro Afonso', 'Porto Alegre do Tocantins', 'Gurupe', 'Lagoa da Confusão', 'Augustinópolis', 'Xambioá', 'Alvorada', 'Arraias', 'Paranã', 'Tocantínia', 'Colmeia', 'Nova Olinda', 'Wanderlândia', 'Peixe', 'Ananás', 'Natividade', 'Praia Norte', 'Pium', 'Sítio Novo do Tocantins', 'Manoel Emídio', 'Aparecida do Rio Negro', 'Palmeirópolis', 'Filadélfia', 'Itaguatins', 'Esperantina', 'Silvanópolis', 'Abreulândia', 'Cristalândia', 'Ponte Alta do Tocantins', 'Ponte Alta do Bom Jesus', 'Caseara', 'Divinópolis do Tocantins', 'Babaçulândia', 'Araguacema', 'Sampaio'
    ] 
  },
  { 
    uf: 'AC', 
    name: 'Acre', 
    region: 'Norte', 
    ddds: ['68'], 
    majorCities: [
      'Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó', 'Brasileia', 'Senador Guiomard', 'Plácido de Castro', 'Xapuri', 'Mâncio Lima', 'Epitaciolândia', 'Acrelândia', 'Porto Acre', 'Rodrigues Alves', 'Marechal Thaumaturgo', 'Bujari', 'Manoel Urbano', 'Jordão', 'Assis Brasil', 'Capixaba', 'Porto Walter', 'Santa Rosa do Purus'
    ] 
  },
  { 
    uf: 'AP', 
    name: 'Amapá', 
    region: 'Norte', 
    ddds: ['96'], 
    majorCities: [
      'Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Mazagão', 'Porto Grande', 'Tartarugalzinho', 'Pedra Branca do Amapari', 'Vitória do Jari', 'Calçoene', 'Amapá', 'Ferreira Gomes', 'Cutias', 'Itaubal', 'Pracuúba', 'Serra do Navio'
    ] 
  },
  { 
    uf: 'RR', 
    name: 'Roraima', 
    region: 'Norte', 
    ddds: ['95'], 
    majorCities: [
      'Boa Vista', 'Rorainópolis', 'Caracaraí', 'Pacaraima', 'Cantá', 'Mucajaí', 'Alto Alegre', 'Bonfim', 'Amajari', 'Normandia', 'Iracema', 'Uiramutã', 'Caroebe', 'São Luiz', 'São João da Baliza'
    ] 
  }
];

/**
  * Infer Brazilian state acronym from phone DDD
  */
export function getStateFromDDD(ddd: string): string {
  for (const state of BRAZIL_STATES) {
    if (state.ddds.includes(ddd)) {
      return state.uf;
    }
  }
  return 'BR';
}

/**
 * Infer Brazilian state from location string or DDD
 */
export function getLeadState(location?: string, ddd?: string): string {
  if (ddd) {
    const dddState = getStateFromDDD(ddd);
    if (dddState && dddState !== 'BR') {
      return dddState;
    }
  }
  if (location) {
    const locUpper = location.toUpperCase();
    for (const state of BRAZIL_STATES) {
      if (locUpper.includes(state.uf) || locUpper.includes(state.name.toUpperCase())) {
        return state.uf;
      }
    }
  }
  return 'SP';
}

/**
 * Clean a keyword of any Brazilian state acronyms (UFs), common city abbreviations or regional terms.
 */
export function cleanKeywordOfStatesAndRegions(keyword: string): string {
  if (!keyword) return '';
  
  const ufs = [
    'SP', 'MG', 'PR', 'SC', 'RS', 'RJ', 'GO', 'MT', 'MS', 'BA', 'CE', 'PE',
    'ES', 'DF', 'AM', 'PA', 'AL', 'SE', 'RN', 'PB', 'MA', 'PI', 'TO', 'RO', 'AC', 'RR', 'AP'
  ].map(u => u.toLowerCase());

  const extraTerms = [
    'bh', 'df', 'poa', 'cwb', 'rj', 'capital', 'interior', 'sul', 'sudeste', 
    'nordeste', 'norte', 'centro', 'centro-oeste', 'brasil', 'br'
  ];

  const tokens = keyword.split(/\s+/);
  const cleanTokens = tokens.filter(token => {
    const cleanToken = token.replace(/[^a-zA-Z0-9áàâãéèêíïóôõöúçñ]/g, '').toLowerCase();
    return !ufs.includes(cleanToken) && !extraTerms.includes(cleanToken);
  });

  return cleanTokens.join(' ').trim();
}

