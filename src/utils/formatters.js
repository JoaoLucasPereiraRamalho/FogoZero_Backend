const formatarDataBR = (data) => {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(data));
};

module.exports = { formatarDataBR };
